import { useState } from 'react';

function Login({ onLogin }) {
  const [formData, setFormData] = useState({
    email: 'admin@octoberave.com',
    password: 'password123',
    role: 'admin',
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (onLogin) {
      onLogin({
        email: formData.email,
        role: formData.role || 'admin',
      });
    }
  }

  const sampleRoles = [
    { role: 'admin', label: 'Admin', email: 'admin@octoberave.com' },
    { role: 'inventory', label: 'Inventory Clerk', email: 'clerk@octoberave.com' },
    { role: 'sales', label: 'Sales Personnel', email: 'sales@octoberave.com' },
    { role: 'instructor', label: 'Instructor', email: 'instructor@octoberave.com' },
  ];

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl sm:p-10">
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            October Avenue
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Business Management System</p>
        </div>

        {/* Demo Role Switcher Quick Pills */}
        <div className="mb-6 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Quick Dev Login Role:
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {sampleRoles.map((item) => (
              <button
                key={item.role}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    role: item.role,
                    email: item.email,
                  }))
                }
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition text-left truncate ${
                  formData.role === item.role
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-700">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="you@octoberave.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-slate-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm mt-2"
          >
            Sign in as {sampleRoles.find((r) => r.role === formData.role)?.label || 'User'}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;
