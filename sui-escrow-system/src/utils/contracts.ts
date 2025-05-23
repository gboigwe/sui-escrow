export interface Milestone {
    description: string;
    amount: bigint;
    status: number; // 0: Pending, 1: Submitted, 2: Approved, 3: Rejected
    deadline: number; // timestamp in milliseconds
    submissionNote: string;
    rejectionReason: string;
  }
  
  export interface EscrowContract {
    id: string;
    client: string;
    freelancer: string;
    totalAmount: bigint;
    remainingBalance: bigint;
    status: number; // 0: Active, 1: Completed, 2: Disputed, 3: Cancelled
    milestones: Milestone[];
    createdAt: number; // timestamp in milliseconds
    endDate: number; // timestamp in milliseconds
    description: string;
  }
  
  export interface Dispute {
    id: string;
    escrowId: string;
    openedBy: string;
    client: string;
    freelancer: string;
    reason: string;
    clientEvidence: string;
    freelancerEvidence: string;
    votesForClient: number;
    votesForFreelancer: number;
    outcome: number; // 0: Pending, 1: Client Wins, 2: Freelancer Wins, 3: Split
    state: number; // 0: Created, 1: Evidence Collection, 2: Voting, 3: Finalized, 4: Withdrawn
    voters: string[];
    createdAt: number;
    evidenceEndTime: number;
    votingEndTime: number;
  }
  
  // Contract status constants
  export const CONTRACT_STATUS = {
    ACTIVE: 0,
    COMPLETED: 1,
    DISPUTED: 2,
    CANCELLED: 3
  };
  
  // Milestone status constants
  export const MILESTONE_STATUS = {
    PENDING: 0,
    SUBMITTED: 1,
    APPROVED: 2,
    REJECTED: 3
  };
  
  // Dispute status constants
  export const DISPUTE_STATE = {
    CREATED: 0,
    EVIDENCE_COLLECTION: 1,
    VOTING: 2,
    FINALIZED: 3,
    WITHDRAWN: 4
  };
  
  export const DISPUTE_OUTCOME = {
    PENDING: 0,
    CLIENT_WINS: 1,
    FREELANCER_WINS: 2,
    SPLIT: 3
  };
  
  // Format functions
  export const formatStatusText = (status: number): string => {
    switch (status) {
      case CONTRACT_STATUS.ACTIVE:
        return 'Active';
      case CONTRACT_STATUS.COMPLETED:
        return 'Completed';
      case CONTRACT_STATUS.DISPUTED:
        return 'Disputed';
      case CONTRACT_STATUS.CANCELLED:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  };
  
  export const formatMilestoneStatusText = (status: number): string => {
    switch (status) {
      case MILESTONE_STATUS.PENDING:
        return 'Pending';
      case MILESTONE_STATUS.SUBMITTED:
        return 'Submitted';
      case MILESTONE_STATUS.APPROVED:
        return 'Approved';
      case MILESTONE_STATUS.REJECTED:
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };
  
  export const formatDisputeStateText = (state: number): string => {
    switch (state) {
      case DISPUTE_STATE.CREATED:
        return 'Created';
      case DISPUTE_STATE.EVIDENCE_COLLECTION:
        return 'Evidence Collection';
      case DISPUTE_STATE.VOTING:
        return 'Voting';
      case DISPUTE_STATE.FINALIZED:
        return 'Finalized';
      case DISPUTE_STATE.WITHDRAWN:
        return 'Withdrawn';
      default:
        return 'Unknown';
    }
  };
  
  export const formatDisputeOutcomeText = (outcome: number): string => {
    switch (outcome) {
      case DISPUTE_OUTCOME.PENDING:
        return 'Pending';
      case DISPUTE_OUTCOME.CLIENT_WINS:
        return 'Client Wins';
      case DISPUTE_OUTCOME.FREELANCER_WINS:
        return 'Freelancer Wins';
      case DISPUTE_OUTCOME.SPLIT:
        return 'Split';
      default:
        return 'Unknown';
    }
  };

  // Make sure this function in contracts.ts looks like this:
  export const formatSuiAmount = (amount: bigint): string => {
    // Convert to string and add decimal point at position length-9
    const amountStr = amount.toString();
    
    
    if (amountStr.length <= 9) {
      // Less than 1 SUI
      const result = '0.' + amountStr.padStart(9, '0') + ' SUI';
      return result;
    } else {
      const decimalPosition = amountStr.length - 9;
      const result = amountStr.slice(0, decimalPosition) + '.' + amountStr.slice(decimalPosition) + ' SUI';
      return result;
    }
  };
  
  // Format date from timestamp
  export const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Calculate remaining time
  export const calculateRemainingTime = (deadline: number): {
    text: string;
    isOverdue: boolean;
    isUrgent?: boolean;
  } => {
    const now = Date.now();
    const timeRemaining = deadline - now;
    
    if (timeRemaining <= 0) {
      return {
        text: 'Overdue',
        isOverdue: true
      };
    }
    
    const days = Math.floor(timeRemaining / (1000 * 60 * 60 * 24));
    
    if (days > 30) {
      const months = Math.floor(days / 30);
      return {
        text: `${months} month${months > 1 ? 's' : ''} left`,
        isOverdue: false
      };
    } else if (days > 0) {
      return {
        text: `${days} day${days > 1 ? 's' : ''} left`,
        isOverdue: false,
        isUrgent: days <= 3
      };
    } else {
      const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
      return {
        text: `${hours} hour${hours > 1 ? 's' : ''} left`,
        isOverdue: false,
        isUrgent: true
      };
    }
  };
  
  // Calculate contract progress percentage
  export const calculateProgress = (contract: EscrowContract): number => {
    if (contract.milestones.length === 0) return 0;
    const completedMilestones = contract.milestones.filter(m => m.status === MILESTONE_STATUS.APPROVED).length;
    return Math.round((completedMilestones / contract.milestones.length) * 100);
  };
  
  // Sort contracts by newest first
  export const sortContractsByDate = (contracts: EscrowContract[]): EscrowContract[] => {
    return [...contracts].sort((a, b) => b.createdAt - a.createdAt);
  };
  
  // Get next milestone that needs action
  export const getNextMilestone = (contract: EscrowContract): { type: string; milestone: Milestone } | null => {
    if (contract.status !== CONTRACT_STATUS.ACTIVE) return null;
    
    // Find first pending milestone
    const pendingMilestone = contract.milestones.find(m => m.status === MILESTONE_STATUS.PENDING);
    if (pendingMilestone) {
      return {
        type: 'pending',
        milestone: pendingMilestone
      };
    }
    
    // Find first submitted milestone
    const submittedMilestone = contract.milestones.find(m => m.status === MILESTONE_STATUS.SUBMITTED);
    if (submittedMilestone) {
      return {
        type: 'submitted',
        milestone: submittedMilestone
      };
    }
    
    return null;
  };
  
  // Convert bigint to number for UI display (if safe)
  export const bigintToNumber = (value: bigint): number => {
    // Check if within safe integer range
    if (value <= BigInt(Number.MAX_SAFE_INTEGER)) {
      return Number(value);
    }
    
    // If larger than safe integer, return a large number for display purposes
    console.warn('BigInt value exceeds safe integer range:', value.toString());
    return Number.MAX_SAFE_INTEGER;
  };
