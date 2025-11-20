<html lang="en">
  <body
    className={`
      ${inter.variable}
      ${robotoMono.variable}
      antialiased
      min-h-screen
      text-gray-100
      bg-[#0f1127]           /* deep cosmic base */
      relative
    `}
  >
    {/* Floating background lights */}
    <div className="floating-bg">
      <div style="background:#6d5dfc; top:-80px; left:-80px;"></div>
      <div style="background:#4fd8ff; bottom:-80px; right:-50px;"></div>
    </div>
    
    {children}
  </body>
</html>
