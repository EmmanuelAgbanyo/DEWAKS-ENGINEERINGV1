import { CommentForm } from "@/components/CommentForm";

export default function CommentDemo() {
    return (
        <div className="p-8 space-y-4">
            <h1 className="text-2xl font-bold">Comments Demo</h1>
            <div className="p-4 border rounded-lg bg-card">
                <CommentForm />
            </div>
        </div>
    );
}
