import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  height?: number;
}

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, 4, 5, 6, false] }],

    [{ font: [] }],
    [{ size: ["small", false, "large", "huge"] }],

    ["bold", "italic", "underline", "strike"],

    [{ color: [] }, { background: [] }],

    [{ list: "ordered" }, { list: "bullet" }],

    [{ indent: "-1" }, { indent: "+1" }],

    [{ align: [] }],

    ["blockquote", "code-block"],

    ["link", "image"],

    ["clean"],
  ],
};

const formats = [
  "header",
  "font",
  "size",
  "bold",
  "italic",
  "underline",
  "strike",
  "color",
  "background",
  "list",
  "bullet",
  "indent",
  "align",
  "blockquote",
  "code-block",
  "link",
  "image",
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Write here...",
  readOnly = false,
  height = 250,
}) => {
  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value || ""}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={readOnly}
      />

      <style>{`
        .rich-text-editor .ql-container {
          min-height: ${height}px;
          font-size: 15px;
        }

        .rich-text-editor .ql-editor {
          min-height: ${height}px;
        }

        .rich-text-editor .ql-toolbar {
          border-radius: 6px 6px 0 0;
        }

        .rich-text-editor .ql-container {
          border-radius: 0 0 6px 6px;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;