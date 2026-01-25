import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export function CommentForm() {
    const [comment, setComment] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || "http://localhost:3000"}/api/comments`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ comment }),
            });

            if (!response.ok) {
                throw new Error("Failed to submit comment");
            }

            const data = await response.json();
            toast.success("Comment submitted!");
            setComment(""); // Clear form
        } catch (error) {
            console.error(error);
            toast.error("Error submitting comment");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-md items-center">
            <Input
                type="text"
                placeholder="Write a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                className="flex-1"
            />
            <Button type="submit" disabled={loading}>
                {loading ? "Submitting..." : "Submit"}
            </Button>
        </form>
    );
}
