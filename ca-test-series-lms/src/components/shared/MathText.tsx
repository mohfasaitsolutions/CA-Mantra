import katex from "katex";

interface MathTextProps {
    text: string;
    className?: string;
}

/**
 * Renders text with inline math expressions delimited by $...$.
 * Plain text is rendered as-is; math segments are rendered via KaTeX.
 * Gracefully falls back to raw LaTeX on parse errors.
 */
const MathText: React.FC<MathTextProps> = ({ text, className }) => {
    if (!text) return null;

    // Split on $...$ but keep the delimiters to know which segments are math
    const parts = text.split(/(\$[^$]+\$)/g);

    return (
        <span className={className}>
            {parts.map((part, i) => {
                if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
                    const latex = part.slice(1, -1);
                    try {
                        const html = katex.renderToString(latex, {
                            throwOnError: false,
                            displayMode: false,
                        });
                        return (
                            <span
                                key={i}
                                dangerouslySetInnerHTML={{ __html: html }}
                            />
                        );
                    } catch {
                        // Show raw LaTeX on error
                        return (
                            <span key={i} className="text-red-500 font-mono text-sm">
                                {part}
                            </span>
                        );
                    }
                }
                return <span key={i}>{part}</span>;
            })}
        </span>
    );
};

export default MathText;
