export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // We use a pass-through layout here because the new HTML design embeds the Sidebar/Header 
  // directly in the page itself, avoiding conflicts with the previously generated layout.
  return <>{children}</>;
}
