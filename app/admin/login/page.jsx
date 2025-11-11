export default function AdminLogin() {
  // input fields className
  const fieldClass =
    "px-3 sm:px-4 py-2 border border-gray-300 outline-none rounded-lg focus:border-green-500 placeholder:text-gray-500 transition-colors duration-150";
  return (
    <div className="min-h-dvh p-3 sm:p-4 flex items-center justify-center">
      <div className="container mx-auto w-full max-w-md">
        {/* card container*/}
        <div className="flex flex-col gap-6 ">
          {/* header */}
          <div className="flex flex-col items-center justify-center ">
            <span className="text-xl sm:text-2xl font-bold">
              EZ-Vendo <span className="text-green-500">Admin</span>
            </span>
            <span className="text-gray-500 text-sm sm:text-base">
              Sign in to your account
            </span>
          </div>
          {/* global message */}
          <div className="flex items-center gap-2 p-3 bg-green-100 rounded-lg border-l-4 border-green-500 text-green-600">
            {/* icon here */}
            Global Message Here
          </div>
          {/* main */}
          <form action="" className="flex flex-col gap-3">
            {/* username or email */}
            <div className="flex flex-col gap-1">
              <label htmlFor="" className="text-sm sm:text-base">
                Username/Email
              </label>
              <input
                type="email"
                name=""
                id=""
                className={fieldClass}
                placeholder="Enter your username/email"
              />
              <span className="hidden text-xs text-red-500">
                Username/email required
              </span>
            </div>
            {/* password */}
            <div className="flex flex-col gap-1">
              <label htmlFor="" className="text-sm sm:text-base">
                Password
              </label>
              <input
                type="password"
                name=""
                id=""
                className={fieldClass}
                placeholder="Enter your password"
              />
              <span className="hidden text-xs text-red-500">
                Password required
              </span>
            </div>
            

            {/* button */}
            <button className="w-full rounded-full px-4 py-2 flex items-center gap-2 justify-center bg-green-500 hover:bg-green-500/90 active:bg-green-600 text-white mt-2 cursor-pointer ">
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
