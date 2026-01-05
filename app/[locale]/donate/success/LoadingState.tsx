import PageHeader from './PageHeader'

type LoadingStateProps = {
  title: string
  subtitle: string
  message: string
}

export default function LoadingState({ title, subtitle, message }: LoadingStateProps) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      <div className="text-center py-12">
        <div className="inline-block relative">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
        </div>
        <p className="mt-4 text-gray-600">{message}</p>
      </div>
    </>
  )
}
