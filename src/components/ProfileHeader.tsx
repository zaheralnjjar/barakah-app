import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ProfileHeaderProps {
    name: string;
    role: string;
    avatarUrl?: string;
}

const ProfileHeader = ({ name, role, avatarUrl }: ProfileHeaderProps) => {
    return (
        <Card className="border-none shadow-sm bg-gradient-to-r from-emerald-500 to-emerald-600 text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('/patterns/islamic-geometric.png')]"></div>
            <CardContent className="p-6 relative z-10 flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-white/50 shadow-md">
                    <AvatarImage src={avatarUrl} alt={name} />
                    <AvatarFallback className="bg-emerald-700 text-white">{name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-xl font-bold">{name}</h2>
                    <p className="text-emerald-50 text-sm opacity-90">{role}</p>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProfileHeader;
