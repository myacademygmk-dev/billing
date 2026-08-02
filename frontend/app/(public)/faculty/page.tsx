'use client';

const TEACHING_STAFF = [
  { name: 'Dr. Srinivasan R.', initials: 'SR', designation: 'Principal & Physics', qualification: 'M.Sc., Ph.D., B.Ed.' },
  { name: 'Mrs. Lakshmi Narayanan', initials: 'LN', designation: 'Vice Principal & Mathematics', qualification: 'M.Sc., M.Phil., B.Ed.' },
  { name: 'Mr. Karthikeyan P.', initials: 'KP', designation: 'Head of Science Dept.', qualification: 'M.Sc. Chemistry, B.Ed.' },
  { name: 'Mrs. Deepa Venkatesh', initials: 'DV', designation: 'English Literature', qualification: 'M.A., M.Phil., B.Ed.' },
  { name: 'Mr. Ramesh Babu S.', initials: 'RB', designation: 'Mathematics', qualification: 'M.Sc., B.Ed.' },
  { name: 'Mrs. Priya Dharshini', initials: 'PD', designation: 'Biology & Environmental Science', qualification: 'M.Sc., B.Ed., NET' },
  { name: 'Mr. Senthil Kumar', initials: 'SK', designation: 'Computer Science', qualification: 'M.C.A., B.Ed.' },
  { name: 'Mrs. Janaki Raman', initials: 'JR', designation: 'Tamil & Social Science', qualification: 'M.A., B.Ed.' },
  { name: 'Mr. Arun Prasad', initials: 'AP', designation: 'Physical Education', qualification: 'M.P.Ed., B.P.Ed.' },
  { name: 'Mrs. Revathi Sundaram', initials: 'RS', designation: 'Commerce & Accountancy', qualification: 'M.Com., M.Phil., B.Ed.' },
];

const STATS = [
  { label: 'Teaching Staff', value: '15+' },
  { label: 'Years Avg Experience', value: '10+' },
];

export default function FacultyPage() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-16 sm:py-20">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-center gap-2 text-sm text-indigo-200">
            <span>Home</span>
            <span>/</span>
            <span className="text-white font-medium">Faculty</span>
          </div>
          <h1 className="mt-4 text-4xl font-bold text-white sm:text-5xl">Our Faculty</h1>
          <p className="mt-3 text-lg text-indigo-100">
            Our dedicated team of educators brings passion, expertise, and years of experience to nurture every student&apos;s potential.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-[#0f172a] py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 max-w-md mx-auto sm:max-w-lg">
            {STATS.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl font-bold text-[#eab308]">{stat.value}</p>
                <p className="mt-2 text-sm font-medium text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Teaching Staff */}
      <section className="bg-[#f5f3ff] py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] bg-clip-text text-transparent">Teaching Staff</span>
            </h2>
            <p className="mt-3 text-gray-600">Meet the experienced educators who guide and inspire our students</p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TEACHING_STAFF.map((staff) => (
              <div
                key={staff.name}
                className="group rounded-2xl bg-white p-6 shadow-md border border-indigo-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#7c3aed] to-[#4f46e5] text-lg font-bold text-white shadow-lg shadow-indigo-500/20">
                    {staff.initials}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{staff.name}</h3>
                    <p className="text-sm font-semibold text-[#4f46e5]">{staff.designation}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#0d9488]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                  </svg>
                  <p className="text-sm text-gray-500">{staff.qualification}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-[#7c3aed] to-[#4f46e5] py-16">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-3xl font-bold text-white">Join Our Team</h2>
          <p className="mx-auto mt-3 max-w-xl text-indigo-100">
            We are always looking for passionate educators who want to make a difference in students&apos; lives. Reach out to us if you share our vision of excellence in education.
          </p>
          <a
            href="/contact"
            className="mt-8 inline-block rounded-xl bg-[#eab308] px-8 py-3.5 text-sm font-bold text-[#0f172a] shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
          >
            Contact Us
          </a>
        </div>
      </section>
    </main>
  );
}
