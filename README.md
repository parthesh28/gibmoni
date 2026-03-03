# gibmoni

crowdfunding platform on Solana that brings accountability through milestone-based fund releases and community governance.

---

## problem

- **lack of trust**: there is risk of devs abandoning the project after fundraising
- **no governance**: funders have no say in whether the project or the dev is genuine 
- **all-or-nothing**: most platforms don't have partial refunds based on proportional delivery
---

## proposal

we introduce **milestone-based funding** with built-in governance:

- **milestone-based fund release**: funds are locked in a central vault and released only after a milestone is approved
- **weighted community voting**: funders vote with voting power proportional to their contribution and reputation
- **automated approval system**: integration with helium's tuktuk for automated milestone approval/rejection
- **retry mechanism**: failed milestones can be retried up to 2 times, giving creators opportunity to improve
- **refunds**: if a project fails, funders have access to a pull-based refund mechanism
- **dynamic reputation**: reputaiton depends on funder's contribution history, voting and platform activity, project success rates
---

## workflow

### project creation & funding
```
1. developer initializes user account → Creates project with:
   - target funding amount
   - number of milestones (1-5)
   - project deadline
   - project name
2. project enters FUNDING state
3. contributors fund the project (funds locked in vault)
4. project transitions to DEVELOPMENT state when ready
```
### milestone execution
```
1. creator posts milestone with:
   - milestone type (DESIGN/DEVELOPMENT/TESTING/DEPLOYMENT)
   - claim amount
2. tuktuk automation queues automatic approval task
3. milestone enters VOTING state
4. funders vote on milestone completion:
   - voting weight = contribution amount × reputation
   - vote approval or rejection 
5. after voting period ends:
   - if approved: funds released to dev, milestone marked complete
   - if rejected: dev can retry (max 3 attempts)
6. Repeat for all milestones until project completes
```
### project completion or failure
```
success Path:
- all 4 milestones approved → project marked COMPLETED
- dev reputation increases

failure Path:
- milestone rejected 3 times OR deadline passed
- project marked FAILED
- funders can claim proportional refunds
```
---

## Instructions

### 1. **initialize**
initializes the global vault account that holds all project funds.

### 2. **initialize_user**
creates a user account for tracking on-chain, contribution history, voting activity, and project statistics. 

### 3. **create_project**
Creates a new crowdfunding project with specified target amount, milestone count, deadline, and name. Project starts in FUNDING state.

### 4. **contribute_fund**
allows users to contribute SOL to a project during the FUNDING phase. 

### 5. **create_milestone**
project creator posts a milestone with type. queues automated approval task via tuktuk crank-turner and starts voting period.

### 6. **vote_on_milestone**
contributors vote on milestone completion with weighted voting power based on contribution amount and reputation

### 7. **approve_milestone**
Automated instruction (called by tuktuk) that tallies votes after voting period ends, checks quorum requirements (30% of funders + 30% of capital), and either releases funds or marks milestone as rejected.

### 8. **retry_milestone**
Project creator can retry a rejected milestone (max 3 attempts). Resets voting state, queues new approval task, and opens new voting period.

### 9. **claim_refund**
Contributors can claim proportional refunds if a project enters FAILED state. Refund amount calculated based on contribution ratio and remaining vault funds.

### 10. **cancel_unfunded_project**
marks a project as FAILED if the target amount is not collected within the funding deadline. automated instruction (called by tuktuk). 

---


## Key mechanisms

### Voting Weight Formula
```
base_weight = contribution_amount × reputation_scaling
reputation_scaling = min(3, sqrt(reputation / 100))
final_weight = min(5000, base_weight)
```

### Quorum Requirements
- **headcount**: 30% of total funders must vote
- **capital**: 30% of total funds must be represented in votes
- **approval**: vote-for weight must exceed vote-against weight

### milestone Attempt Limits
- Maximum 3 attempts per milestone
- after 3 rejections, project can be marked as FAILED

### refund Calculation
```
refund = (contributor_amount / total_collected) × remaining_vault_funds
```
---