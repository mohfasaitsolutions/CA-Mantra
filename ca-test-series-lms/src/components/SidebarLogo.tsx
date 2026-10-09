import { memo } from "react";

const SidebarLogo = memo(() => {
  return (
    <div className="flex items-center flex-shrink-0 px-4">
      <div className="flex items-center">
        <img
          src="/camantralogo.jpg"
          alt="CA Mantraa Logo"
          className="h-8 w-auto"
          loading="eager"
        />
      </div>
    </div>
  );
});

SidebarLogo.displayName = "SidebarLogo";

export default SidebarLogo;
