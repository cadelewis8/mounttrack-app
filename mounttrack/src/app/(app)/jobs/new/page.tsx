import { JobIntakeForm } from '@/components/job-intake-form'

export default function NewJobPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">New Job</h1>
      <JobIntakeForm />
    </div>
  )
}
