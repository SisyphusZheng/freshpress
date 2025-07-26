import { Handlers, PageProps } from "fresh";
import { Head } from "fresh/runtime";
import { loadPost, Post } from "@freshpress/plugin-markdown";

export const handler: Handlers<Post> = {
  async GET(_req, ctx) {
    const post = await loadPost(ctx.params.slug);
    if (!post) {
      return ctx.renderNotFound();
    }
    return ctx.render(post);
  },
};

export default function PostPage({ data }: PageProps<Post>) {
  return (
    <>
      <Head>
        <title>{data.title}</title>
      </Head>
      <div class="min-h-screen bg-base-100">
        <div class="container mx-auto px-4 py-8">
          <div class="max-w-screen-md mx-auto">
            <article
              class="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: data.content }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
