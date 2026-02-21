"use client"

import { CollaboratorCRM } from "@/types"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, Mail, Phone, ExternalLink, MapPin, Search } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { Input } from "@/components/ui/input"

interface CollaboratorListProps {
    collaborators: CollaboratorCRM[]
}

export function CollaboratorList({ collaborators }: CollaboratorListProps) {
    const [searchQuery, setSearchQuery] = useState("")

    const filteredCollaborators = collaborators.filter(c =>
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.country?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name, email or country..."
                    className="pl-10 bg-background/50 border-muted-foreground/20 h-11"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {filteredCollaborators.length === 0 ? (
                <div className="text-center py-20 bg-muted/20 border-2 border-dashed rounded-3xl">
                    <p className="text-muted-foreground text-lg">No collaborators found matching your search.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCollaborators.map((collaborator) => (
                        <Card key={collaborator.id} className="group hover:shadow-2xl hover:shadow-cyan-500/10 transition-all duration-300 border-none bg-gradient-to-br from-card to-muted/30 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-1 h-full bg-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <CardTitle className="text-xl font-bold">{collaborator.full_name}</CardTitle>
                                        <div className="flex items-center gap-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`h-3 w-3 ${i < (collaborator.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/30"}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    {collaborator.country && (
                                        <Badge variant="outline" className="gap-1 bg-background/50 backdrop-blur-sm border-muted-foreground/20">
                                            <MapPin className="h-3 w-3" /> {collaborator.country}
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="space-y-3 pb-4">
                                {collaborator.email && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span className="truncate">{collaborator.email}</span>
                                    </div>
                                )}
                                {collaborator.phone && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Phone className="h-4 w-4" />
                                        <span>{collaborator.phone}</span>
                                    </div>
                                )}
                                {collaborator.notes && (
                                    <p className="text-xs text-muted-foreground line-clamp-2 italic bg-muted/40 p-2 rounded-lg">
                                        &quot;{collaborator.notes}&quot;
                                    </p>
                                )}
                            </CardContent>

                            <CardFooter className="pt-0">
                                <Button asChild variant="secondary" className="w-full gap-2 rounded-xl group/btn hover:bg-cyan-600 hover:text-white transition-all">
                                    <Link href={`/collaborators/${collaborator.id}`}>
                                        View Profile
                                        <ExternalLink className="h-4 w-4 group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                    </Link>
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
