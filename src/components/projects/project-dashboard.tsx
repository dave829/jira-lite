'use client';

import { Issue, ProjectStatus } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/constants';

interface ProjectDashboardProps {
  issues: Issue[];
  statuses: ProjectStatus[];
}

export function ProjectDashboard({ issues, statuses }: ProjectDashboardProps) {
  // 상태별 이슈 수
  const statusData = statuses.map((status) => ({
    name: status.name,
    value: issues.filter((i) => i.status_id === status.id).length,
    color: status.color,
  }));

  // 우선순위별 이슈 수
  const priorityData = [
    {
      name: PRIORITY_LABELS.HIGH,
      value: issues.filter((i) => i.priority === 'HIGH').length,
      color: PRIORITY_COLORS.HIGH,
    },
    {
      name: PRIORITY_LABELS.MEDIUM,
      value: issues.filter((i) => i.priority === 'MEDIUM').length,
      color: PRIORITY_COLORS.MEDIUM,
    },
    {
      name: PRIORITY_LABELS.LOW,
      value: issues.filter((i) => i.priority === 'LOW').length,
      color: PRIORITY_COLORS.LOW,
    },
  ];

  // 완료율
  const doneStatus = statuses.find((s) => s.name === 'Done');
  const completedCount = doneStatus
    ? issues.filter((i) => i.status_id === doneStatus.id).length
    : 0;
  const completionRate = issues.length > 0
    ? Math.round((completedCount / issues.length) * 100)
    : 0;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* 통계 카드 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">프로젝트 현황</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-3xl font-bold">{issues.length}</p>
              <p className="text-sm text-gray-500">전체 이슈</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{completionRate}%</p>
              <p className="text-sm text-gray-500">완료율</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">
                {issues.filter((i) => i.status?.name === 'In Progress').length}
              </p>
              <p className="text-sm text-gray-500">진행 중</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">
                {issues.filter((i) => i.priority === 'HIGH').length}
              </p>
              <p className="text-sm text-gray-500">긴급 이슈</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 상태별 차트 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">상태별 이슈</CardTitle>
        </CardHeader>
        <CardContent>
          {issues.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">데이터가 없습니다</p>
          )}
        </CardContent>
      </Card>

      {/* 우선순위별 차트 */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">우선순위별 이슈</CardTitle>
        </CardHeader>
        <CardContent>
          {issues.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={priorityData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="이슈 수">
                  {priorityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-8">데이터가 없습니다</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
