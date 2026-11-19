import { cs } from "@backtickjs/core";
import { useState } from "react" with { backtick: "client" };

// The editor's tags: Enter adds what's typed, the cross removes a tag. Each tag
// is sent with the form as a `tag` field, so none at all is an empty list.
export const TagInput = cs`(props: { initial: string[] }) => {
  const [tags, setTags] = $useState(props.initial);
  const [draft, setDraft] = $useState("");
  return (
    <>
      <input
        type="text"
        className="form-control"
        placeholder="Enter tags"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          const tag = draft.trim();
          if (tag && !tags.includes(tag)) setTags([...tags, tag]);
          setDraft("");
        }}
      />
      <div className="tag-list">
        {tags.map((tag) => (
          <span key={tag} className="tag-default tag-pill">
            <i
              className="ion-close-round"
              onClick={() => setTags(tags.filter((other) => other !== tag))}
            ></i>{" "}
            {tag}
            <input type="hidden" name="tag" value={tag} />
          </span>
        ))}
      </div>
    </>
  );
}`;
