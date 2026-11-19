import { cs } from "@backtickjs/core";
import { createSignal, For } from "solid-js" with { backtick: "client" };

// The editor's tags: Enter adds what's typed, the cross removes a tag. Each tag
// is sent with the form as a `tag` field, so none at all is an empty list.
export const TagInput = cs`(props: { initial: string[] }) => {
  const [tags, setTags] = $createSignal(props.initial);
  const [draft, setDraft] = $createSignal("");
  return (
    <>
      <input
        type="text"
        class="form-control"
        placeholder="Enter tags"
        value={draft()}
        onInput={(event) => setDraft(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") {
            return;
          }
          event.preventDefault();
          const tag = draft().trim();
          if (tag && !tags().includes(tag)) {
            setTags([...tags(), tag]);
          }
          setDraft("");
        }}
      />
      <div class="tag-list">
        <$For each={tags()}>
          {(tag) => (
            <span class="tag-default tag-pill">
              <i
                class="ion-close-round"
                onClick={() => setTags(tags().filter((other) => other !== tag))}
              ></i>{" "}
              {tag}
              <input type="hidden" name="tag" value={tag} />
            </span>
          )}
        </$For>
      </div>
    </>
  );
}`;
