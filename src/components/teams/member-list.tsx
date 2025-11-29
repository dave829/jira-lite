'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Crown, Shield, User } from 'lucide-react';
import { MemberActions } from '@/components/teams/member-actions';
import { ProfileEditDialog } from '@/components/teams/profile-edit-dialog';

const roleIcons = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
};

const roleLabels = {
  OWNER: '소유자',
  ADMIN: '관리자',
  MEMBER: '멤버',
};

import { TeamMember } from '@/types';

interface MemberListProps {
  members: TeamMember[];
  currentUserId: string;
  currentRole: string;
  teamId: string;
}

export function MemberList({ members, currentUserId, currentRole, teamId }: MemberListProps) {
  return (
    <Card className="glass-card border-border/50">
      <CardHeader>
        <CardTitle className="text-base text-foreground">팀 멤버</CardTitle>
        <CardDescription>{members?.length || 0}명</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members?.map((member) => {
            const RoleIcon = roleIcons[member.role as keyof typeof roleIcons];
            const memberUser = Array.isArray(member.user) ? member.user[0] : member.user;
            const isCurrentUser = member.user_id === currentUserId;

            const memberContent = (
              <div className={`flex items-center justify-between p-3 border border-border/50 rounded-lg transition-colors ${isCurrentUser ? 'hover:bg-accent cursor-pointer' : ''}`}>
                <div className="flex items-center gap-3">
                  <Avatar className="border border-border/50">
                    <AvatarImage src={memberUser?.profile_image || undefined} />
                    <AvatarFallback className="bg-foreground/10 text-foreground">
                      {memberUser?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-foreground">
                      {memberUser?.name}
                      {isCurrentUser && <span className="text-xs text-muted-foreground ml-2">(나)</span>}
                    </p>
                    <p className="text-sm text-muted-foreground">{memberUser?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <RoleIcon className="h-3 w-3" />
                    {roleLabels[member.role as keyof typeof roleLabels]}
                  </Badge>
                  {!isCurrentUser && (
                    <MemberActions
                      member={member}
                      currentRole={currentRole}
                      teamId={teamId}
                    />
                  )}
                </div>
              </div>
            );

            return isCurrentUser && memberUser ? (
              <ProfileEditDialog
                key={member.id}
                user={{
                  id: memberUser.id,
                  name: memberUser.name,
                  email: memberUser.email,
                  profile_image: memberUser.profile_image,
                }}
              >
                {memberContent}
              </ProfileEditDialog>
            ) : (
              <div key={member.id}>{memberContent}</div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
