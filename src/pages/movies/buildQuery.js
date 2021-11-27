/**
 * Concatenates various params
 * @param {Object} searchParams
 * @param {Number} searchParams.page
 * @param {string} searchParams.certification
 * @param {string} searchParams.certificationCountry
 * @param {string} searchParams.primaryReleaseDateGTE
 * @param {string} searchParams.primaryReleaseDateLTE
 * @param {boolean} searchParams.adult
 * @returns {string} the complete query params
 */
export function buildQuery({
  page = 1,
  year,
  primaryReleaseDateLTE,
  primaryReleaseDateGTE,
  adult,
  certification,
  certificationCountry,
}) {
  let query = `/movies?page=${page < 1 || page > 500 ? 1 : page}`;

  if (primaryReleaseDateLTE) {
    query += `&primaryReleaseDateLTE=${primaryReleaseDateLTE}`;
  }

  if (primaryReleaseDateGTE) {
    query += `&primaryReleaseDateGTE=${primaryReleaseDateGTE}`;
  }

  if (year && !(primaryReleaseDateLTE && primaryReleaseDateGTE)) {
    query += `&year=${year}`;
  }

  if (certification && certificationCountry) {
    query += `&certificationCountry=${certificationCountry}&certification=${certification}`;
  }

  if (adult) {
    query += `&adult=${adult}`;
  }

  return query;
}
