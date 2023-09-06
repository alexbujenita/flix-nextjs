import axios from "axios";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { buildQuery } from "../../lib/buildQuery";
import styles from "./FilterMovies.module.scss";

export default function FilterMovies() {
  useEffect(() => {
    getCerts();
  }, []);
  const router = useRouter();

  const [certifications, setCertifications] = useState({});

  const [showFilters, setShowFilters] = useState(false);
  const [adult, setAdult] = useState(false);
  const [certificationCountry, setCertificationCountry] = useState(null);
  const [cert, setCert] = useState(null);
  const [year, setYear] = useState(null);
  const [dateLTE, setDateLTE] = useState(null);
  const [dateGTE, setDateGTE] = useState(null);

  function showHideFilters() {
    setShowFilters(!showFilters);
  }

  async function getCerts() {
    try {
      const { data } = await axios.get(
        "http://localhost:3001/api/certifications"
      );
      setCertifications(data.certifications);
    } catch (error) {
      console.log(error);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const finalQuery = buildQuery({
      page: null,
      year,
      primaryReleaseDateGTE: dateGTE,
      primaryReleaseDateLTE: dateLTE,
      certification: cert,
      certificationCountry,
      adult,
    });
    setAdult(false);
    setCertificationCountry(null);
    setCert(null);
    setYear(null);
    setDateGTE(null);
    setDateLTE(null);
    setShowFilters(false);
    router.push(finalQuery);
  }

  function yearsGenerator() {
    const years = [];
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year > 1884; year--) {
      years.push(year);
    }
    return years;
  }

  const YYYY_MM_DD = `${new Date().getFullYear()}-${
    new Date().getMonth() + 1
  }-${new Date().getDate()}`;

  return (
    <div className={styles.filterContainer}>
      <span onClick={showHideFilters}>Filter Options</span>
      {showFilters && (
        <form className={styles.filterForm} onSubmit={handleSubmit}>
          <div className={styles.filterItems}>
            <label>Year</label>
            <select
              defaultValue="Choose a year"
              onChange={(e) => {
                setYear(e.target.value);
              }}
            >
              <option disabled>Choose a year</option>
              {yearsGenerator().map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.filterItems}>
            <label>Released after</label>
            <input
              type="date"
              min="1885-01-01"
              max={YYYY_MM_DD}
              onChange={(e) => {
                setDateGTE(e.target.value);
              }}
            />
          </div>

          <div className={styles.filterItems}>
            <label>Released before</label>
            <input
              type="date"
              min="1885-01-01"
              max={YYYY_MM_DD}
              onChange={(e) => {
                setDateLTE(e.target.value);
              }}
            />
          </div>

          <div className={styles.filterItems}>
            <label>Certification country</label>
            <select
              defaultValue="Choose a country"
              onChange={(e) => {
                setCertificationCountry(e.target.value);
              }}
            >
              <option disabled>Choose a country</option>
              {Object.keys(certifications).map((countryCode) => (
                <option key={countryCode} value={countryCode}>
                  {countryCode}
                </option>
              ))}
            </select>
          </div>
          {certificationCountry && (
            <div className={styles.filterItems}>
              <label>Certification</label>
              <select
                defaultValue="Choose a certification"
                onChange={(e) => {
                  setCert(e.target.value);
                }}
              >
                <option disabled>Choose a certification</option>
                {certifications[certificationCountry].map((cert) => (
                  <option key={cert.certification} value={cert.certification}>
                    {cert.certification}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label>Include adult</label>
            <input
              type="checkbox"
              value={adult}
              onChange={() => {
                setAdult(!adult);
              }}
            />
          </div>
          <button className={styles.filterButton} type="submit">
            Refine search
          </button>
        </form>
      )}
    </div>
  );
}
