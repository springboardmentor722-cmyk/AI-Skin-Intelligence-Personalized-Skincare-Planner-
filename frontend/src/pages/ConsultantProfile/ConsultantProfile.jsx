import { useState } from "react";

import ConsultantStep1 from "./ConsultantStep1";
import ConsultantStep2 from "./ConsultantStep2";
import ConsultantStep3 from "./ConsultantStep3";
import ConsultantStep4 from "./ConsultantStep4";
import ConsultantStep5 from "./ConsultantStep5";

function ConsultantProfile() {
  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    city: "",

    qualification: "",
    specialization: "",
    experience: 0,

    hospital: "",
    department: "",

    available_days: "",
    languages: "",
  });

  const nextStep = () => setStep(step +1);

  const prevStep = () => setStep(step -1);

  switch (step) {
    case 1:
      return (
        <ConsultantStep1
          nextStep={nextStep}
          formData={formData}
          setFormData={setFormData}
        />
      );

    case 2:
      return (
        <ConsultantStep2
          nextStep={nextStep}
          prevStep={prevStep}
          formData={formData}
          setFormData={setFormData}
        />
      );

    case 3:
      return (
        <ConsultantStep3
          nextStep={nextStep}
          prevStep={prevStep}
          formData={formData}
          setFormData={setFormData}
        />
      );

    case 4:
      return (
        <ConsultantStep4
          nextStep={nextStep}
          prevStep={prevStep}
          formData={formData}
          setFormData={setFormData}
        />
      );

    case 5:
      return (
        <ConsultantStep5
          prevStep={prevStep}
          formData={formData}
        />
      );

    default:
      return null;
  }
}

export default ConsultantProfile;