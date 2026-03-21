import { FileText } from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';

export default function CvAnalysisPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Analyse de CV</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Telechargez votre CV pour obtenir une analyse ATS detaillee.
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center py-10 text-center">
          <FileText className="h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            Bientot disponible
          </h3>
          <p className="mt-2 max-w-sm text-sm text-gray-600">
            La fonctionnalite d'analyse de CV sera disponible prochainement.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
