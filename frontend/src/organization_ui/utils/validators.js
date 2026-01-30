export const validators = {
  isValidEmail: (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  },

  isValidAge: (age) => {
    const ageNum = parseInt(age);
    return !isNaN(ageNum) && ageNum >= 18 && ageNum <= 120;
  },

  isValidBMI: (bmi) => {
    const bmiNum = parseFloat(bmi);
    return !isNaN(bmiNum) && bmiNum >= 10 && bmiNum <= 100;
  },

  isValidBloodPressure: (systolic, diastolic) => {
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    return (
      !isNaN(sys) && !isNaN(dia) &&
      sys >= 70 && sys <= 250 &&
      dia >= 40 && dia <= 150 &&
      sys > dia
    );
  },

  isValidGlucose: (glucose) => {
    const glucoseNum = parseInt(glucose);
    return !isNaN(glucoseNum) && glucoseNum >= 50 && glucoseNum <= 500;
  },

  isValidCholesterol: (cholesterol) => {
    const cholNum = parseInt(cholesterol);
    return !isNaN(cholNum) && cholNum >= 100 && cholNum <= 400;
  },

  isValidMedicationCount: (count) => {
    const countNum = parseInt(count);
    return !isNaN(countNum) && countNum >= 0 && countNum <= 50;
  },

  isValidVisitCount: (count) => {
    const countNum = parseInt(count);
    return !isNaN(countNum) && countNum >= 0 && countNum <= 100;
  },

  isValidPhoneNumber: (phone) => {
    const re = /^[\d\s-()]+$/;
return re.test(phone) && phone.replace(/\D/g, '').length === 10;
},isValidZipCode: (zip) => {
const re = /^\d{5}(-\d{4})?$/;
return re.test(zip);
}
};export default validators;