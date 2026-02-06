'use client';

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar as CalendarIcon, MoreVertical, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { updateTask, deleteTask } from "@/app/(dashboard)/tasks/actions";
import { useRouter } from "next/navigation";

interface TaskProps {
    task: any;
}

export function TaskCard({ task }: TaskProps) {
    const router = useRouter();
    const [isDeleting, setIsDeleting] = useState(false);

    const priorityColors = {
        Low: "bg-blue-100 text-blue-700 hover:bg-blue-200",
        Medium: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
        High: "bg-red-100 text-red-700 hover:bg-red-200",
    };

    const statusColors = {
        Todo: "border-slate-300",
        'In Progress': "border-blue-400 bg-blue-50/50",
        Done: "border-green-400 bg-green-50/50",
        Postponed: "border-orange-300 bg-orange-50/50",
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        await deleteTask(task.id);
        setIsDeleting(false);
    };

    const handleStatusChange = async (newStatus: string) => {
        await updateTask(task.id, { status: newStatus });
    };

    return (
        <div className="group relative">
            <Card className={`mb-3 cursor-pointer transition-all hover:shadow-md ${statusColors[task.status as keyof typeof statusColors] || 'border-slate-200'}`}>
                <CardHeader className="p-3 pb-0 flex flex-row items-start justify-between space-y-0">
                    <Badge className={`text-[10px] px-1.5 py-0.5 pointer-events-none ${priorityColors[task.priority as keyof typeof priorityColors] || 'bg-slate-100'}`} variant="secondary">
                        {task.priority}
                    </Badge>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-2">
                                <MoreVertical className="h-3 w-3" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleStatusChange('Todo')}>Mark as Todo</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange('In Progress')}>Mark In Progress</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange('Done')}>Mark Done</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusChange('Postponed')}>Postpone</DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={handleDelete}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                    <h4 className="text-sm font-semibold leading-tight mb-1">{task.title}</h4>
                    <div className="flex items-center text-xs text-muted-foreground gap-2 mt-2">
                        {task.due_date && (
                            <div className={`flex items-center gap-1 ${new Date(task.due_date) < new Date() && task.status !== 'Done' ? 'text-red-500 font-medium' : ''}`}>
                                <CalendarIcon className="h-3 w-3" />
                                {format(new Date(task.due_date), "MMM d")}
                            </div>
                        )}
                        {task.project && (
                            <Badge variant="outline" className="text-[10px] px-1 h-4 font-normal truncate max-w-[80px]">
                                {task.project.title}
                            </Badge>
                        )}
                    </div>
                </CardContent>
                {/* Visual Preview on Hover (Absolute Positioned) */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 left-full ml-2 z-50 w-64 p-4 bg-popover text-popover-foreground rounded-md border shadow-lg pointer-events-none hidden md:block">
                    <h5 className="font-semibold text-sm mb-1">{task.title}</h5>
                    <p className="text-xs text-muted-foreground line-clamp-4">{task.description || "No description provided."}</p>
                    {task.due_date && <div className="mt-2 text-xs font-medium">Due: {format(new Date(task.due_date), "PPP")}</div>}
                </div>
            </Card>
        </div>
    );
}
