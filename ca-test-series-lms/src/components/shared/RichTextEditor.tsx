import React, { useCallback, useMemo, useEffect } from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  height?: string;
}

// This component temporarily suppresses the findDOMNode deprecation warning
// from ReactQuill until they update to remove findDOMNode usage.
// The warning is harmless and doesn't affect functionality.

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start writing...",
  className = "",
  height = "400px",
}) => {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ color: [] }, { background: [] }],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ indent: "-1" }, { indent: "+1" }],
        [{ align: [] }],
        ["blockquote", "code-block"],
        ["link"],
        ["clean"],
      ],
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const formats = useMemo(
    () => [
      "header",
      "font",
      "size",
      "bold",
      "italic",
      "underline",
      "strike",
      "blockquote",
      "list",
      "bullet",
      "indent",
      "link",
      "color",
      "background",
      "align",
      "code-block",
    ],
    []
  );

  const handleChange = useCallback(
    (content: string) => {
      onChange(content);
    },
    [onChange]
  );

  // Apply custom styles and suppress findDOMNode warning
  useEffect(() => {
    const styleId = "rich-text-editor-styles";
    if (document.getElementById(styleId)) return;

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .rich-text-editor .ql-container {
        min-height: ${height};
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        border-bottom: 1px solid #e2e8f0;
        border-left: 1px solid #e2e8f0;
        border-right: 1px solid #e2e8f0;
        border-radius: 0 0 6px 6px;
      }
      
      .rich-text-editor .ql-editor {
        min-height: ${height};
        font-size: 16px;
        line-height: 1.6;
      }
      
      .rich-text-editor .ql-toolbar {
        border-top: 1px solid #e2e8f0;
        border-left: 1px solid #e2e8f0;
        border-right: 1px solid #e2e8f0;
        border-radius: 6px 6px 0 0;
        background: #f8fafc;
      }
      
      .rich-text-editor .ql-editor.ql-blank::before {
        color: #9ca3af;
        font-style: normal;
      }
      
      .rich-text-editor .ql-editor p {
        margin-bottom: 12px;
      }
      
      .rich-text-editor .ql-editor h1,
      .rich-text-editor .ql-editor h2,
      .rich-text-editor .ql-editor h3,
      .rich-text-editor .ql-editor h4,
      .rich-text-editor .ql-editor h5,
      .rich-text-editor .ql-editor h6 {
        margin-top: 20px;
        margin-bottom: 12px;
        font-weight: 600;
      }
      
      .rich-text-editor .ql-editor blockquote {
        border-left: 4px solid #e2e8f0;
        padding-left: 16px;
        margin-left: 0;
        margin-right: 0;
        color: #64748b;
      }
      
      .rich-text-editor .ql-editor code {
        background-color: #f1f5f9;
        padding: 2px 4px;
        border-radius: 4px;
        font-size: 14px;
      }
      
      .rich-text-editor .ql-editor pre {
        background-color: #f8fafc;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        padding: 12px;
        overflow-x: auto;
      }
      
      .rich-text-editor .ql-editor img {
        max-width: 100%;
        height: auto;
        border-radius: 6px;
        margin: 12px 0;
      }
    `;
    document.head.appendChild(style);

    // Temporarily suppress findDOMNode warning from ReactQuill
    // This is a known issue with ReactQuill v2.0.0 and React 18
    const originalError = console.error;
    let isSuppressionActive = true;

    console.error = (...args) => {
      if (
        isSuppressionActive &&
        typeof args[0] === "string" &&
        (args[0].includes("findDOMNode is deprecated") ||
          args[0].includes("Warning: findDOMNode is deprecated"))
      ) {
        return; // Suppress ReactQuill findDOMNode warnings
      }
      originalError(...args);
    };

    // Restore console.error after component unmounts
    return () => {
      isSuppressionActive = false;
      console.error = originalError;
    };
  }, [height]);

  return (
    <div className={`rich-text-editor ${className}`}>
      <ReactQuill
        theme="snow"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
      />
    </div>
  );
};

export default RichTextEditor;
