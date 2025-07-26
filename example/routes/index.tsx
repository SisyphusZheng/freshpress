import { define } from "../utils.ts";

export default define.page(function Home() {
  return (
    <div class="min-h-screen bg-base-100">
      <div class="container mx-auto px-4 py-8">
        <div class="max-w-screen-md mx-auto flex flex-col items-center justify-center">
          <img
            class="my-6"
            src="/logo.svg"
            width="128"
            height="128"
            alt="the FreshPress logo"
          />
          <h1 class="text-4xl font-bold text-primary mb-4">
            Welcome to FreshPress
          </h1>
          <p class="text-lg text-base-content/70 mb-8 text-center">
            Your new documentation site with Tailwind CSS and daisyUI is ready.
          </p>
          <a href="/posts/getting-started" class="btn btn-primary">
            Get started
          </a>
        </div>
      </div>
    </div>
  );
});
