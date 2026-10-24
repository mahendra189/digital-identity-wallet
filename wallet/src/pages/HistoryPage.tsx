import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { SharedHistoryEntry } from '../types/history';
import { History, Building2, Calendar, Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react';

interface HistoryPageProps {
  entries: SharedHistoryEntry[];
  onNavigate: (route: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({ entries, onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-zinc-200">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Activity & Consents</h1>
          <p className="text-sm text-zinc-500 mt-1">Audit log of your selective disclosure presentations to verifiers</p>
        </div>

        <Button variant="outline" size="sm" onClick={() => onNavigate('/')}>
          Back to Credentials
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card className="border-dashed p-12 text-center">
          <div className="size-10 rounded-full bg-zinc-100 text-zinc-500 flex items-center justify-center mx-auto mb-3">
            <History className="size-5" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900">No activity yet</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
            You haven't presented your credentials to any verifiers yet.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {entries.map((item) => {
            const isVerified = item.outcome === 'ACCEPTED';
            const dateStr = new Date(item.timestamp).toLocaleString();

            return (
              <Card key={item.id} className="overflow-hidden">
                <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 font-semibold text-zinc-900 text-sm">
                        <Building2 className="size-4 text-zinc-500" />
                        {item.verifierName}
                      </div>

                      <Badge variant={isVerified ? 'success' : 'destructive'} className="text-[10px]">
                        {isVerified ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="size-3" /> Verified
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <XCircle className="size-3" /> Rejected
                          </span>
                        )}
                      </Badge>
                    </div>

                    <p className="text-xs text-zinc-600">{item.purpose}</p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-zinc-500">
                      <span className="flex items-center gap-1 text-emerald-700">
                        <Eye className="size-3" /> Disclosed: {item.disclosedClaims.join(', ') || 'None'}
                      </span>

                      {item.withheldClaims.length > 0 && (
                        <span className="flex items-center gap-1 text-zinc-400">
                          <EyeOff className="size-3" /> Withheld: {item.withheldClaims.join(', ')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-zinc-400 font-mono flex items-center gap-1 shrink-0">
                    <Calendar className="size-3.5" />
                    {dateStr}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
