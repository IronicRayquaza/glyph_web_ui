import Sidebar from "@/components/layout/Sidebar";

export default function DashboardLayout({ children }) {
  return (
    <div className="text-black font-sans min-h-screen flex flex-row relative bg-transparent">
      {/* Persistent Atmospheric Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed inset-0 w-full h-full object-cover z-0 pointer-events-none"
      >
        <source
          src="/From%20Klickpin.com-%20Stylish%20Pinterest%20marketing%20ideas%20that%20feel%20fresh%20elevated%20and%20surprisingly%20easy%20to%20recreate%20at%20home%20for%20busy%20people%20who%20still.mp4"
          type="video/mp4"
        />
      </video>

      {/* Persistent Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="grow flex flex-col min-w-0 z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
}
