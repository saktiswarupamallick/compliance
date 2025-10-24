import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SignupPage() {
  const [form, setForm] = useState({ 
    email: "", 
    password: "", 
    name: "", 
    phone: "", 
    role: "client",
    specializations: []
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const specializations = [
    "GDPR", "CCPA", "HIPAA", "SOX", "Contract Law", 
    "Privacy Law", "Data Protection", "Corporate Law", "Employment Law", "Other"
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSpecializationChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setForm({ ...form, specializations: [...form.specializations, value] });
    } else {
      setForm({ 
        ...form, 
        specializations: form.specializations.filter(s => s !== value) 
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!form.password) newErrors.password = "Password is required";
    
    if (form.password && form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }
    
    if (form.role === "lawyer" && form.specializations.length === 0) {
      newErrors.specializations = "Lawyers must select at least one specialization";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SERVER_URL}/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      } else {
        if (data.details && Array.isArray(data.details)) {
          setErrors({ password: data.details.join(", ") });
        } else {
          alert(data.error || "Signup failed");
        }
      }
    } catch (err) {
      alert("Something went wrong");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="card w-full max-w-md shadow-xl bg-base-100">
        <form onSubmit={handleSignup} className="card-body">
          <h2 className="card-title justify-center text-2xl">Sign Up</h2>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Full Name</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="Enter your full name"
              className={`input input-bordered ${errors.name ? 'input-error' : ''}`}
              value={form.name}
              onChange={handleChange}
              required
            />
            {errors.name && <span className="text-error text-sm">{errors.name}</span>}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Email</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              className={`input input-bordered ${errors.email ? 'input-error' : ''}`}
              value={form.email}
              onChange={handleChange}
              required
            />
            {errors.email && <span className="text-error text-sm">{errors.email}</span>}
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Phone (Optional)</span>
            </label>
            <input
              type="tel"
              name="phone"
              placeholder="Enter your phone number"
              className="input input-bordered"
              value={form.phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-control">
            <label className="label">
              <span className="label-text">Account Type</span>
            </label>
            <div className="flex gap-4">
              <label className="label cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="client"
                  checked={form.role === "client"}
                  onChange={handleChange}
                  className="radio radio-primary"
                />
                <span className="label-text ml-2">Client</span>
              </label>
              <label className="label cursor-pointer">
                <input
                  type="radio"
                  name="role"
                  value="lawyer"
                  checked={form.role === "lawyer"}
                  onChange={handleChange}
                  className="radio radio-primary"
                />
                <span className="label-text ml-2">Lawyer</span>
              </label>
            </div>
          </div>

          {form.role === "lawyer" && (
            <div className="form-control">
              <label className="label">
                <span className="label-text">Specializations</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {specializations.map((spec) => (
                  <label key={spec} className="label cursor-pointer">
                    <input
                      type="checkbox"
                      value={spec}
                      checked={form.specializations.includes(spec)}
                      onChange={handleSpecializationChange}
                      className="checkbox checkbox-primary checkbox-sm"
                    />
                    <span className="label-text ml-2 text-sm">{spec}</span>
                  </label>
                ))}
              </div>
              {errors.specializations && (
                <span className="text-error text-sm">{errors.specializations}</span>
              )}
            </div>
          )}

          <div className="form-control">
            <label className="label">
              <span className="label-text">Password</span>
            </label>
            <input
              type="password"
              name="password"
              placeholder="Create a strong password"
              className={`input input-bordered ${errors.password ? 'input-error' : ''}`}
              value={form.password}
              onChange={handleChange}
              required
            />
            {errors.password && <span className="text-error text-sm">{errors.password}</span>}
            <div className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters with uppercase, lowercase, number, and special character
            </div>
          </div>

          <div className="form-control mt-6">
            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>

          <div className="text-center mt-4">
            <span className="text-sm">
              Already have an account?{" "}
              <a href="/login" className="link link-primary">
                Sign in
              </a>
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}
