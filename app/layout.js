export const metadata = {
  title: 'First Cut',
  description: 'AI first-haircut advisor'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
