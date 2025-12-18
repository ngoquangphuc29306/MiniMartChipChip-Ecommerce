// Service to handle Vietnam region API calls
// Using provinces.open-api.vn - Free public API for Vietnam administrative data
// Documentation: https://provinces.open-api.vn/

const BASE_URL = 'https://provinces.open-api.vn/api';

/**
 * Fetches the list of provinces
 * @returns {Promise<Array>} List of provinces with {code, name} format
 */
export const fetchProvinces = async () => {
  try {
    const response = await fetch(`${BASE_URL}/p/`);
    if (!response.ok) throw new Error('Failed to fetch provinces');

    const data = await response.json();
    const list = Array.isArray(data) ? data : [];

    // Transform to {code, name} format
    // API returns: {code, name, code_name, full_name, full_name_en, ...}
    return list
      .map(p => ({
        code: String(p.code), // Ensure code is string for consistency
        name: p.name,
        type: p.full_name || p.name
      }))
      .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  } catch (error) {
    console.error("Failed to fetch provinces:", error);
    return [];
  }
};

/**
 * Fetches districts for a specific province
 * @param {string|number} provinceCode 
 * @returns {Promise<Array>} List of districts
 */
const fetchDistricts = async (provinceCode) => {
  try {
    // API endpoint: /p/{provinceCode}?depth=2 returns province with nested districts
    const response = await fetch(`${BASE_URL}/p/${provinceCode}?depth=2`);
    if (!response.ok) throw new Error('Failed to fetch districts');

    const provinceData = await response.json();
    // API returns province with districts nested inside
    const districts = provinceData.districts || [];

    return districts.map(d => ({
      code: String(d.code),
      name: d.name,
      province_code: String(provinceCode)
    })).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  } catch (error) {
    console.error("Failed to fetch districts:", error);
    return [];
  }
};

/**
 * Fetches wards for a specific district
 * @param {string|number} districtCode 
 * @returns {Promise<Array>} List of wards
 */
const fetchWards = async (districtCode) => {
  try {
    // API endpoint: /d/{districtCode}?depth=2 returns district with nested wards
    const response = await fetch(`${BASE_URL}/d/${districtCode}?depth=2`);
    if (!response.ok) throw new Error('Failed to fetch wards');

    const districtData = await response.json();
    // API returns district with wards nested inside
    const wards = districtData.wards || [];

    return wards.map(w => ({
      code: String(w.code),
      name: w.name,
      district_code: String(districtCode),
      province_code: String(districtData.province_code || districtData.province?.code || '')
    })).sort((a, b) => a.name.localeCompare(b.name, 'vi'));
  } catch (error) {
    console.error("Failed to fetch wards:", error);
    return [];
  }
};

/**
 * Fetches all districts and wards for a specific province
 * @param {string|number} provinceCode 
 * @returns {Promise<{districts: Array, wards: Array}>}
 */
export const fetchDistrictsAndWards = async (provinceCode) => {
  if (!provinceCode) return { districts: [], wards: [] };

  console.log(`Fetching districts/wards for Province Code: ${provinceCode}`);

  try {
    // Fetch districts for the province
    const districts = await fetchDistricts(provinceCode);
    console.log(`Fetched ${districts.length} districts for province ${provinceCode}`);

    if (districts.length === 0) {
      console.warn(`No districts found for province ${provinceCode}`);
      return { districts: [], wards: [] };
    }

    // Fetch all wards for all districts in this province
    const allWardsPromises = districts.map(district => fetchWards(district.code));
    const allWardsArrays = await Promise.all(allWardsPromises);
    const allWards = allWardsArrays.flat();

    console.log(`Fetched ${allWards.length} wards for province ${provinceCode}`);

    if (allWards.length > 0) {
      console.log("Sample ward structure:", allWards[0]);
    }

    return {
      districts,
      wards: allWards
    };
  } catch (error) {
    console.error("Failed to fetch districts and wards:", error);
    return { districts: [], wards: [] };
  }
};

/**
 * Filters a list of wards by district code
 * @param {Array} allWards - List of all wards for the province
 * @param {string|number} districtCode - The district code to filter by
 * @returns {Array} Filtered list of wards
 */
export const filterWardsByDistrict = (allWards, districtCode) => {
  if (!allWards || !districtCode) return [];

  return allWards
    .filter(w => String(w.district_code) === String(districtCode))
    .map(w => ({
      code: w.code,
      name: w.name,
      district_code: w.district_code,
      province_code: w.province_code
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'));
};