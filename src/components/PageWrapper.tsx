export default function PageWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="container mx-auto px-8 pt-32">{children}</div>
}
