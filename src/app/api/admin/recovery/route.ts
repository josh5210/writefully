// /src/app/api/admin/recovery/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { timeoutRecoveryService } from '@/lib/jobs/timeoutRecovery';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { action, sessionId } = await request.json();

    switch (action) {
      case 'start':
        await timeoutRecoveryService.start();
        return NextResponse.json({ message: 'Recovery service started' });

      case 'stop':
        await timeoutRecoveryService.stop();
        return NextResponse.json({ message: 'Recovery service stopped' });

      case 'status':
        const activeRecoveries = timeoutRecoveryService.getActiveRecoveries();
        return NextResponse.json({ 
          active: activeRecoveries.length,
          recoveries: activeRecoveries 
        });

      case 'recover':
        if (!sessionId) {
          return NextResponse.json(
            { error: 'sessionId required for manual recovery' },
            { status: 400 }
          );
        }
        
        // TODO: Manual recovery will need to be implemented
        return NextResponse.json({ message: `Manual recovery triggered for ${sessionId}` });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Recovery API error:', error);
    return NextResponse.json(
      { error: 'Recovery operation failed' },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<NextResponse> {
  try {
    const activeRecoveries = timeoutRecoveryService.getActiveRecoveries();
    
    return NextResponse.json({
      active: activeRecoveries.length,
      recoveries: activeRecoveries,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Recovery status error:', error);
    return NextResponse.json(
      { error: 'Failed to get recovery status' },
      { status: 500 }
    );
  }
}