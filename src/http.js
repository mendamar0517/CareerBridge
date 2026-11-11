// HTTP туслах: алдааны төрөл, оролтын шалгалт (Zod), id параметр
class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

const badRequest = (message, extra) => new HttpError(400, message, extra);
const notFound = (message = 'Олдсонгүй') => new HttpError(404, message);
const forbidden = (message = 'Энэ үйлдлийг хийх эрхгүй') => new HttpError(403, message);
const conflict = (message, extra) => new HttpError(409, message, extra);

/** Zod схемээр шалгаад, амжилтгүй бол 400 + талбар бүрийн алдааг буцаана. */
function parse(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (result.success) return result.data;
  const errors = result.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
  throw badRequest(errors[0].message, { errors });
}

/** URL дахь :id — эерэг бүхэл тоо биш бол 404 (оршин байгаа эсэхийг задруулахгүй). */
function idParam(value) {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) throw notFound();
  return id;
}

/** ILIKE-д хэрэглэгчийн оролтыг тусгай тэмдэгтгүйгээр дамжуулна. */
function likePattern(value) {
  const escaped = String(value).replace(/[\\%_]/g, (c) => '\\' + c);
  return '%' + escaped + '%';
}

// PostgreSQL-ийн алдааны кодыг ойлгомжтой HTTP хариу болгоно
function mapDbError(err) {
  switch (err.code) {
    case '23505':
      return conflict('Ийм мэдээлэл аль хэдийн бүртгэгдсэн байна', { constraint: err.constraint });
    case '23503':
    case '23514':
    case '22P02':
    case '22007':
    case '22008':
    case '22003':
      return badRequest('Оруулсан утга буруу байна');
    default:
      return null;
  }
}

module.exports = { HttpError, badRequest, notFound, forbidden, conflict, parse, idParam, likePattern, mapDbError };
