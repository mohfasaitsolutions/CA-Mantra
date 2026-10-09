import { useCallback } from "react";
import { Button } from "@/components/ui/button";

interface MathToolbarProps {
    /** Ref to the textarea element for inserting text at cursor */
    textareaRef?: React.RefObject<HTMLTextAreaElement>;
    /** Called with the text to insert (fallback if no ref provided) */
    onInsert: (text: string) => void;
}

const mathSymbols = [
    { label: "x²", insert: "$x^2$", title: "Superscript / Exponent" },
    { label: "√x", insert: "$\\sqrt{x}$", title: "Square Root" },
    { label: "∛x", insert: "$\\sqrt[3]{x}$", title: "Cube Root" },
    { label: "a/b", insert: "$\\frac{a}{b}$", title: "Fraction" },
    { label: "xₙ", insert: "$x_n$", title: "Subscript" },
    { label: "±", insert: "$\\pm$", title: "Plus/Minus" },
    { label: "≥", insert: "$\\geq$", title: "Greater than or equal" },
    { label: "≤", insert: "$\\leq$", title: "Less than or equal" },
    { label: "≠", insert: "$\\neq$", title: "Not equal" },
    { label: "∞", insert: "$\\infty$", title: "Infinity" },
    { label: "π", insert: "$\\pi$", title: "Pi" },
    { label: "Σ", insert: "$\\sum$", title: "Summation" },
    { label: "∫", insert: "$\\int$", title: "Integral" },
    { label: "×", insert: "$\\times$", title: "Multiplication" },
    { label: "÷", insert: "$\\div$", title: "Division" },
    { label: "°", insert: "$^\\circ$", title: "Degree" },
];

/**
 * A toolbar with common math symbol buttons.
 * Inserts LaTeX at the cursor position in the linked textarea,
 * or calls onInsert with the full text appended.
 */
const MathToolbar: React.FC<MathToolbarProps> = ({ textareaRef, onInsert }) => {
    const handleInsert = useCallback(
        (symbol: string) => {
            if (textareaRef?.current) {
                const el = textareaRef.current;
                const start = el.selectionStart;
                const end = el.selectionEnd;
                const value = el.value;
                const newValue =
                    value.substring(0, start) + symbol + value.substring(end);

                // Update via the onInsert callback with new full value
                onInsert(newValue);

                // Restore cursor position after React re-renders
                requestAnimationFrame(() => {
                    el.focus();
                    const newPos = start + symbol.length;
                    el.setSelectionRange(newPos, newPos);
                });
            } else {
                onInsert(symbol);
            }
        },
        [textareaRef, onInsert]
    );

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
                {mathSymbols.map((sym) => (
                    <Button
                        key={sym.label}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 px-2.5 text-sm font-medium hover:bg-blue-50 hover:border-blue-300"
                        title={sym.title}
                        onClick={() => handleInsert(sym.insert)}
                    >
                        {sym.label}
                    </Button>
                ))}
            </div>
            <p className="text-xs text-gray-400">
                💡 Use <code className="bg-gray-100 px-1 rounded">$...$</code> for
                math, e.g.{" "}
                <code className="bg-gray-100 px-1 rounded">$x^2 + \sqrt{"{y}"}$</code>
            </p>
        </div>
    );
};

export default MathToolbar;
