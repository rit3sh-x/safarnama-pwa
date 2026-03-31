import { useState, useCallback } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PlusIcon, XIcon, BarChart3Icon } from "lucide-react";

interface CreatePollDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreatePoll: (data: {
        question: string;
        options: string[];
        allowMultiple: boolean;
        isAnonymous: boolean;
    }) => void;
}

export function CreatePollDialog({
    open,
    onOpenChange,
    onCreatePoll,
}: CreatePollDialogProps) {
    const [question, setQuestion] = useState("");
    const [options, setOptions] = useState(["", ""]);
    const [allowMultiple, setAllowMultiple] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);

    const resetForm = useCallback(() => {
        setQuestion("");
        setOptions(["", ""]);
        setAllowMultiple(false);
        setIsAnonymous(false);
    }, []);

    const handleClose = useCallback(
        (open: boolean) => {
            if (!open) resetForm();
            onOpenChange(open);
        },
        [onOpenChange, resetForm]
    );

    const addOption = useCallback(() => {
        if (options.length < 10) {
            setOptions([...options, ""]);
        }
    }, [options]);

    const removeOption = useCallback(
        (index: number) => {
            if (options.length > 2) {
                setOptions(options.filter((_, i) => i !== index));
            }
        },
        [options]
    );

    const updateOption = useCallback(
        (index: number, value: string) => {
            const updated = [...options];
            updated[index] = value;
            setOptions(updated);
        },
        [options]
    );

    const canSubmit =
        question.trim().length > 0 &&
        options.filter((o) => o.trim().length > 0).length >= 2;

    const handleSubmit = useCallback(() => {
        if (!canSubmit) return;
        const validOptions = options
            .map((o) => o.trim())
            .filter((o) => o.length > 0);
        onCreatePoll({
            question: question.trim(),
            options: validOptions,
            allowMultiple,
            isAnonymous,
        });
        resetForm();
        onOpenChange(false);
    }, [
        canSubmit,
        question,
        options,
        allowMultiple,
        isAnonymous,
        onCreatePoll,
        resetForm,
        onOpenChange,
    ]);

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BarChart3Icon className="size-5" />
                        Create Poll
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label htmlFor="poll-question">Question</Label>
                        <Input
                            id="poll-question"
                            placeholder="Ask a question..."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                }
                            }}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Options</Label>
                        <div className="space-y-2">
                            {options.map((option, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-2"
                                >
                                    <Input
                                        placeholder={`Option ${idx + 1}`}
                                        value={option}
                                        onChange={(e) =>
                                            updateOption(idx, e.target.value)
                                        }
                                        onKeyDown={(e) => {
                                            if (
                                                e.key === "Enter" &&
                                                idx === options.length - 1 &&
                                                options.length < 10
                                            ) {
                                                e.preventDefault();
                                                addOption();
                                            }
                                        }}
                                    />
                                    {options.length > 2 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            aria-label="Remove option"
                                            className="h-9 w-9 shrink-0"
                                            onClick={() => removeOption(idx)}
                                        >
                                            <XIcon className="size-4 text-muted-foreground" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                        {options.length < 10 && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={addOption}
                                className="text-muted-foreground"
                            >
                                <PlusIcon className="mr-1 size-4" />
                                Add option
                            </Button>
                        )}
                    </div>

                    <div className="space-y-3 rounded-lg border p-3">
                        <div className="flex items-center justify-between">
                            <Label
                                htmlFor="allow-multiple"
                                className="cursor-pointer text-sm"
                            >
                                Allow multiple answers
                            </Label>
                            <Switch
                                id="allow-multiple"
                                checked={allowMultiple}
                                onCheckedChange={setAllowMultiple}
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <Label
                                htmlFor="anonymous"
                                className="cursor-pointer text-sm"
                            >
                                Anonymous voting
                            </Label>
                            <Switch
                                id="anonymous"
                                checked={isAnonymous}
                                onCheckedChange={setIsAnonymous}
                            />
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => handleClose(false)}
                    >
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={!canSubmit}>
                        <BarChart3Icon className="mr-1 size-4" />
                        Create Poll
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
