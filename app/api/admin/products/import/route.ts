import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { isAdmin } from "@/lib/isAdmin";
import { authOptions } from "@/lib/auth";
import { getPrisma } from "@/lib/prisma";
import { sanitizeHtml } from "@/lib/sanitize";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import * as fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";

interface ProductImportRow {
  title: string;
  slug?: string;
  description?: string;
  price: string | number;
  stock: string | number;
  category?: string;
  category_slug?: string;
  images?: string;
  isActive?: string | boolean;
  isFeatured?: string | boolean;
  specs?: string;
  flavors?: string;
  flavor_stock?: string;
}

interface ProductSpec {
  key: string;
  value: string;
}

interface FlavorImport {
  name: string;
  stock: number;
}

interface ImportError {
  row: ProductImportRow;
  error: string;
  rowNumber: number;
}

interface ImportedProduct {
  id: number;
  title: string;
}

type FileType = "csv" | "excel" | "unknown";

function getFileType(filename: string): FileType {
  const extension = filename.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return "csv";
  }

  if (extension === "xlsx" || extension === "xls") {
    return "excel";
  }

  return "unknown";
}

function normalizeString(value: unknown): string {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function parseBoolean(
  value: unknown,
  defaultValue: boolean
): boolean {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value !== "string") {
    return defaultValue;
  }

  const normalized = value.trim().toLowerCase();

  if (
    normalized === "true" ||
    normalized === "1" ||
    normalized === "yes"
  ) {
    return true;
  }

  if (
    normalized === "false" ||
    normalized === "0" ||
    normalized === "no"
  ) {
    return false;
  }

  return defaultValue;
}

function parseNonNegativeInteger(
  value: unknown
): number | null {
  if (typeof value === "number") {
    if (
      Number.isInteger(value) &&
      Number.isSafeInteger(value) &&
      value >= 0
    ) {
      return value;
    }

    return null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .trim()
    .replace(/,/g, "");

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (
    !Number.isInteger(parsed) ||
    !Number.isSafeInteger(parsed) ||
    parsed < 0
  ) {
    return null;
  }

  return parsed;
}

function createSlug(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function validateSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

function parseSpecs(
  value: unknown
): ProductSpec[] | null {
  const raw = normalizeString(value);

  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return null;
    }

    const specs: ProductSpec[] = [];

    for (const item of parsed) {
      if (
        typeof item !== "object" ||
        item === null ||
        !("key" in item) ||
        !("value" in item)
      ) {
        return null;
      }

      const keyValue = item.key;
      const valueValue = item.value;

      if (
        typeof keyValue !== "string" ||
        typeof valueValue !== "string"
      ) {
        return null;
      }

      const key = keyValue.trim();
      const specValue = valueValue.trim();

      if (!key || !specValue) {
        return null;
      }

      specs.push({
        key,
        value: specValue,
      });
    }

    return specs;
  } catch {
    return null;
  }
}

function parseFlavors(
  flavorsValue: unknown,
  stocksValue: unknown
): FlavorImport[] | null {
  const flavorsRaw = normalizeString(flavorsValue);
  const stocksRaw = normalizeString(stocksValue);

  if (!flavorsRaw && !stocksRaw) {
    return [];
  }

  if (!flavorsRaw || !stocksRaw) {
    return null;
  }

  const names = flavorsRaw
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

  const stockValues = stocksRaw
    .split("|")
    .map((item) => item.trim());

  if (names.length === 0) {
    return null;
  }

  if (names.length !== stockValues.length) {
    return null;
  }

  const result: FlavorImport[] = [];
  const normalizedNames = new Set<string>();

  for (let index = 0; index < names.length; index += 1) {
    const name = names[index];
    const stockValue = stockValues[index];

    if (!name || stockValue === undefined) {
      return null;
    }

    const stock = parseNonNegativeInteger(stockValue);

    if (stock === null) {
      return null;
    }

    const normalizedName = name.toLocaleLowerCase("fa-IR");

    if (normalizedNames.has(normalizedName)) {
      return null;
    }

    normalizedNames.add(normalizedName);

    result.push({
      name,
      stock,
    });
  }

  return result;
}

function parseImages(value: unknown): string[] {
  const raw = normalizeString(value);

  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function excelToJson(buffer: Buffer): ProductImportRow[] {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
    cellDates: false,
  });

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return [];
  }

  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    return [];
  }

  return XLSX.utils.sheet_to_json<ProductImportRow>(
    worksheet,
    {
      defval: "",
      raw: false,
      blankrows: false,
    }
  );
}

async function parseCsv(
  file: File
): Promise<ProductImportRow[]> {
  const text = await file.text();

  return new Promise<ProductImportRow[]>(
    (resolve, reject) => {
      Papa.parse<ProductImportRow>(text, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header: string) =>
          header.trim(),
        complete: (
          result: Papa.ParseResult<ProductImportRow>
        ) => {
          if (result.errors.length > 0) {
            const firstError = result.errors[0];

            reject(
              new Error(
                `خطا در ساختار CSV در ردیف ${(firstError.row ?? 0) + 1}: ${firstError.message}`
              )
            );

            return;
          }

          resolve(result.data);
        },
        error: (error: Error) => {
          reject(error);
        },
      });
    }
  );
}

async function downloadAndSaveImage(
  url: string
): Promise<string | null> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return null;
    }

    const buffer = await response.arrayBuffer();

    const webpBuffer = await sharp(
      Buffer.from(buffer)
    )
      .resize(1200, 1200, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({
        quality: 80,
      })
      .toBuffer();

    const fileName = `${uuidv4()}.webp`;

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads"
    );

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, {
        recursive: true,
      });
    }

    fs.writeFileSync(
      path.join(uploadDir, fileName),
      webpBuffer
    );

    return `/uploads/${fileName}`;
  } catch (error) {
    console.error(
      "Error downloading image:",
      error
    );

    return null;
  }
}

async function processImages(
  images: string[]
): Promise<string[]> {
  const savedImages: string[] = [];

  for (const image of images) {
    if (/^https?:\/\//i.test(image)) {
      const savedUrl =
        await downloadAndSaveImage(image);

      if (savedUrl) {
        savedImages.push(savedUrl);
      }

      continue;
    }

    savedImages.push(image);
  }

  return savedImages;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const session =
      await getServerSession(authOptions);

    if (
      !session?.user?.id ||
      !(await isAdmin(session.user.id))
    ) {
      return NextResponse.json(
        {
          error: "دسترسی غیرمجاز",
        },
        {
          status: 403,
        }
      );
    }

    const formData =
      await request.formData();

    const fileEntry = formData.get("file");

    if (!(fileEntry instanceof File)) {
      return NextResponse.json(
        {
          error: "فایل ارسال نشده است",
        },
        {
          status: 400,
        }
      );
    }

    const fileType = getFileType(
      fileEntry.name
    );

    if (fileType === "unknown") {
      return NextResponse.json(
        {
          error:
            "فرمت فایل پشتیبانی نمی‌شود. فقط CSV و Excel مجاز هستند.",
        },
        {
          status: 400,
        }
      );
    }

    const buffer = Buffer.from(
      await fileEntry.arrayBuffer()
    );

    let rows: ProductImportRow[];

    if (fileType === "csv") {
      rows = await parseCsv(fileEntry);
    } else {
      rows = excelToJson(buffer);
    }

    if (rows.length === 0) {
      return NextResponse.json(
        {
          error:
            "فایل خالی است یا هیچ محصولی در آن پیدا نشد.",
        },
        {
          status: 400,
        }
      );
    }

    const prisma = await getPrisma();

    const importedProducts: ImportedProduct[] = [];
    const errors: ImportError[] = [];

    for (
      let index = 0;
      index < rows.length;
      index += 1
    ) {
      const row = rows[index];
      const rowNumber = index + 2;

      try {
        const title = normalizeString(
          row.title
        );

        if (!title) {
          throw new Error(
            "عنوان محصول الزامی است."
          );
        }

        if (title.length < 2) {
          throw new Error(
            "عنوان محصول حداقل باید ۲ کاراکتر باشد."
          );
        }

        if (title.length > 200) {
          throw new Error(
            "عنوان محصول حداکثر می‌تواند ۲۰۰ کاراکتر باشد."
          );
        }

        const rawSlug =
          normalizeString(row.slug);

        const slug =
          rawSlug || createSlug(title);

        if (!slug) {
          throw new Error(
            "امکان ساخت slug معتبر از عنوان محصول وجود ندارد."
          );
        }

        if (
          slug.length < 2 ||
          slug.length > 200 ||
          !validateSlug(slug)
        ) {
          throw new Error(
            `slug نامعتبر است: ${slug}`
          );
        }

        const description =
          normalizeString(
            row.description
          );

        const price =
          parseNonNegativeInteger(
            row.price
          );

        if (price === null) {
          throw new Error(
            "قیمت باید یک عدد صحیح صفر یا بیشتر باشد."
          );
        }

        const stock =
          parseNonNegativeInteger(
            row.stock
          );

        if (stock === null) {
          throw new Error(
            "موجودی کل باید یک عدد صحیح صفر یا بیشتر باشد."
          );
        }

        const categoryName =
          normalizeString(row.category);

        const categorySlug =
          normalizeString(
            row.category_slug
          );

        if (!categoryName && !categorySlug) {
          throw new Error(
            "دسته‌بندی محصول الزامی است."
          );
        }

        let category = null;

        if (categorySlug) {
          category =
            await prisma.category.findUnique({
              where: {
                slug: categorySlug,
              },
            });
        }

        if (
          !category &&
          categoryName
        ) {
          category =
            await prisma.category.findFirst({
              where: {
                name: categoryName,
              },
            });
        }

        if (!category) {
          throw new Error(
            `دسته‌بندی پیدا نشد: ${
              categoryName ||
              categorySlug
            }`
          );
        }

        const specs = parseSpecs(
          row.specs
        );

        if (specs === null) {
          throw new Error(
            "ساختار specs نامعتبر است. باید JSON معتبر از آرایه key/value باشد."
          );
        }

        const flavors = parseFlavors(
          row.flavors,
          row.flavor_stock
        );

        if (flavors === null) {
          throw new Error(
            "ساختار طعم‌ها نامعتبر است. تعداد نام طعم‌ها باید دقیقاً با تعداد موجودی‌ها برابر باشد و با | از هم جدا شوند."
          );
        }

        const existingProduct =
          await prisma.product.findUnique({
            where: {
              slug,
            },
            select: {
              id: true,
              title: true,
            },
          });

        if (existingProduct) {
          throw new Error(
            `محصولی با slug «${slug}» قبلاً وجود دارد. Import فقط محصولات جدید را اضافه می‌کند.`
          );
        }

        const images = parseImages(
          row.images
        );

        const savedImages =
          await processImages(images);

        const isActive = parseBoolean(
          row.isActive,
          true
        );

        const isFeatured = parseBoolean(
          row.isFeatured,
          false
        );

        const sanitizedDescription =
          description
            ? sanitizeHtml(description)
            : "";

        const product =
          await prisma.$transaction(
            async (transaction) => {
              const createdProduct =
                await transaction.product.create(
                  {
                    data: {
                      title,
                      slug,
                      description:
                        sanitizedDescription,
                      price,
                      stock,
                      images:
                        savedImages,
                      isActive,
                      isFeatured,
                      categoryId:
                        category.id,
                      specs: {
                        create: specs.map(
                          (spec) => ({
                            key: spec.key,
                            value:
                              spec.value,
                          })
                        ),
                      },
                      flavors: {
                        create: flavors.map(
                          (flavor) => ({
                            name:
                              flavor.name,
                            stock:
                              flavor.stock,
                            price: null,
                            isActive: true,
                          })
                        ),
                      },
                    },
                    select: {
                      id: true,
                      title: true,
                    },
                  }
                );

              return createdProduct;
            }
          );

        importedProducts.push(
          product
        );
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "خطای نامشخص هنگام وارد کردن محصول";

        errors.push({
          row,
          error: errorMessage,
          rowNumber,
        });
      }
    }

    return NextResponse.json({
      success: true,
      imported:
        importedProducts.length,
      errors,
      total: rows.length,
    });
  } catch (error) {
    console.error(
      "Import products error:",
      error
    );

    const errorMessage =
      error instanceof Error
        ? error.message
        : "خطا در وارد کردن محصولات";

    return NextResponse.json(
      {
        error: errorMessage,
      },
      {
        status: 500,
      }
    );
  }
}