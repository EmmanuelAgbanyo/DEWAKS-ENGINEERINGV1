import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Tag, Plus, Loader2, Save, Trash2, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  subscribeToCategories,
  createCategory,
  recordToArray,
} from "@/lib/firebase-db";
import { useToast } from "@/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

export default function CategoriesPage() {
    const [categories, setCategories] = useState<{ id: string; name: string; active: boolean }[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        const unsub = subscribeToCategories((data) => {
            setCategories(recordToArray(data));
            setIsLoading(false);
        });
        return () => unsub();
    }, []);

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCategoryName.trim()) return;

        setIsCreating(true);
        try {
            await createCategory({
                name: newCategoryName.trim(),
                active: true,
                createdAt: new Date().toISOString(),
            });
            setNewCategoryName("");
            setIsDialogOpen(false);
            toast({
                title: "Success",
                description: "Category created successfully",
                className: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500",
            });
        } catch (error) {
            console.error("Failed to create category:", error);
            toast({
                title: "Error",
                description: "Failed to create category",
                variant: "destructive",
            });
        } finally {
            setIsCreating(false);
        }
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="space-y-4">
                    <div className="h-8 w-48 shimmer rounded-lg" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-24 shimmer rounded-xl" />
                        ))}
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground tracking-tight">
                            Categories
                        </h1>
                        <p className="text-muted-foreground">
                            Manage expense categories for cash requests
                        </p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                                <Plus className="w-4 h-4 mr-2" />
                                New Category
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md glass-card border-white/10">
                            <DialogHeader>
                                <DialogTitle>Add New Category</DialogTitle>
                                <DialogDescription>
                                    Create a new category for classifying cash requests.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreateCategory} className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-foreground">
                                        Category Name
                                    </label>
                                    <Input
                                        placeholder="e.g. Office Supplies"
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        className="bg-secondary/30 border-border/50"
                                    />
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => setIsDialogOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={!newCategoryName.trim() || isCreating}
                                        className="bg-primary text-primary-foreground"
                                    >
                                        {isCreating ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4 mr-2" />
                                                Create Category
                                            </>
                                        )}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categories.map((category, index) => (
                        <motion.div
                            key={category.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            className="glass-card p-5 group flex items-start justify-between hover:border-primary/30 transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                    <Tag className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground">
                                        {category.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full border border-emerald-400/20">
                                            <CheckCircle2 className="w-3 h-3" />
                                            Active
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}

                    {categories.length === 0 && (
                        <div className="col-span-full py-12 text-center glass-card">
                            <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                                <Tag className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground mb-4">No categories found</p>
                            <Button
                                variant="outline"
                                onClick={() => setIsDialogOpen(true)}
                            >
                                Create your first category
                            </Button>
                        </div>
                    )}
                </div>
            </motion.div>
        </DashboardLayout>
    );
}
