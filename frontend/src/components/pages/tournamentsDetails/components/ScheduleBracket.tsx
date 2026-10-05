import { Box, Chip, Paper, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import { useNavigate } from 'react-router-dom';
import type {
  Match,
  ScheduleBracketProps,
  SideColumnLayout,
} from '../../../../types';
import EncoderResultButton from './EncoderResultButton';

type BracketSide = 'left' | 'right';

const formatDateTime = (dateTime: string) => {
  try {
    const date = new Date(dateTime);
    if (Number.isNaN(date.getTime())) {
      return '-';
    }
    return date.toLocaleString('fr-FR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateTime;
  }
};

const getStateDisplay = (state: string) => {
  switch (state) {
    case 'PLANIFIED':
      return { label: 'Planifie', color: 'info' };
    case 'ONGOING':
      return { label: 'En cours', color: 'warning' };
    case 'ENDED':
      return { label: 'Terminé', color: 'success' };
    case 'CONTESTED':
      return { label: 'Contesté', color: 'error' };
    default:
      return { label: state, color: 'default' };
  }
};

const isByeMatch = (match: Match) =>
  match.state === 'ENDED' &&
  Boolean(match.byeTeamId && !match.team1Id && !match.team2Id);

const ScheduleBracket = ({
  matches,
  onSuccess,
  tournamentId,
}: ScheduleBracketProps) => {
  const navigate = useNavigate();

  if (!matches || matches.length === 0) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Aucun planning généré pour ce tournoi.
        </Typography>
      </Paper>
    );
  }

  const matchesByRound = matches.reduce(
    (acc, match) => {
      if (!acc[match.round]) {
        acc[match.round] = [];
      }
      acc[match.round].push(match);
      return acc;
    },
    {} as Record<number, Match[]>,
  );

  const rounds = Object.keys(matchesByRound)
    .map(Number)
    .sort((a, b) => a - b);

  const teamNameById = matches.reduce(
    (acc, currentMatch) => {
      if (currentMatch.team1Id && currentMatch.team1Name) {
        acc[currentMatch.team1Id] = currentMatch.team1Name;
      }
      if (currentMatch.team2Id && currentMatch.team2Name) {
        acc[currentMatch.team2Id] = currentMatch.team2Name;
      }
      return acc;
    },
    {} as Record<number, string>,
  );

  const createGroupedByeMatch = (
    round: number,
    side: BracketSide,
    groupIndex: number,
    firstBye: Match,
    secondBye: Match,
  ): Match => {
    const firstName =
      firstBye.team1Name ||
      firstBye.team2Name ||
      (firstBye.byeTeamId !== undefined
        ? teamNameById[firstBye.byeTeamId]
        : undefined) ||
      '-';
    const secondName =
      secondBye.team1Name ||
      secondBye.team2Name ||
      (secondBye.byeTeamId !== undefined
        ? teamNameById[secondBye.byeTeamId]
        : undefined) ||
      '-';

    return {
      matchId: -(round * 1000 + (side === 'left' ? 300 : 400) + groupIndex + 1),
      round,
      startTime: '-',
      state: 'PLANIFIED',
      team1Name: firstName,
      team1Id: firstBye.byeTeamId,
      team2Name: secondName,
      team2Id: secondBye.byeTeamId,
      groupedFromBye: true,
    };
  };

  const consolidateByes = (
    round: number,
    side: BracketSide,
    bracketMatches: Match[],
  ) => {
    const byeMatches = bracketMatches.filter(isByeMatch);
    if (byeMatches.length < 2) {
      return bracketMatches;
    }

    const groupedByFirstMatchId = new Map<number, Match>();
    const skippedSecondMatchIds = new Set<number>();
    let groupIndex = 0;

    for (
      let leftIndex = 0, rightIndex = byeMatches.length - 1;
      leftIndex < rightIndex;
      leftIndex += 1, rightIndex -= 1
    ) {
      const firstBye = byeMatches[leftIndex];
      const secondBye = byeMatches[rightIndex];

      groupedByFirstMatchId.set(
        firstBye.matchId,
        createGroupedByeMatch(round, side, groupIndex, firstBye, secondBye),
      );
      skippedSecondMatchIds.add(secondBye.matchId);
      groupIndex += 1;
    }

    return bracketMatches.flatMap((match) => {
      if (skippedSecondMatchIds.has(match.matchId)) {
        return [];
      }

      const grouped = groupedByFirstMatchId.get(match.matchId);
      return grouped ? [grouped] : [match];
    });
  };

  const getRoundLabel = (round: number, totalRounds: number) => {
    if (totalRounds === 1) return 'Finale';
    if (round === totalRounds) return 'Finale';
    if (round === totalRounds - 1) return 'Demi-finale';
    if (round === totalRounds - 2) return 'Quarts de finale';
    if (round === totalRounds - 3) return 'Huitièmes de finale';
    if (round === totalRounds - 4) return 'Seizièmes de finale';
    if (round === totalRounds - 5) return 'Trente-deuxièmes de finale';
    return `Round ${round}`;
  };

  const totalRounds = rounds.length;
  // prevent overlapping of cards
  const bracketMatchZIndex = (
    round: number,
    matchIndex: number,
    matchesInRound: number,
  ) => 10 + (totalRounds - round) * 50 + (matchesInRound - matchIndex);
  const finalRound = rounds[rounds.length - 1];
  const stageRounds = rounds.slice(0, -1);
  const leftByRound: Record<number, Match[]> = {};
  const rightByRound: Record<number, Match[]> = {};
  const cardGap = 80;
  const cardMinHeight = 92;
  const columnWidth = 190;
  const columnGap = 44;
  const labelAreaHeight = 42;
  const lineColor = 'rgba(255,255,255,0.7)';

  const createPlaceholderMatch = (
    round: number,
    side: BracketSide,
    index: number,
  ): Match => ({
    matchId: -(round * 1000 + (side === 'left' ? 100 : 200) + index + 1),
    round,
    startTime: '-',
    state: 'PLANIFIED',
    team1Name: '-',
    team2Name: '-',
  });

  stageRounds.forEach((round, stageIndex) => {
    const roundMatches = [...matchesByRound[round]].sort(
      (a, b) => a.matchId - b.matchId,
    );
    const groupedRoundMatches = consolidateByes(round, 'left', roundMatches);
    const middle = Math.ceil(groupedRoundMatches.length / 2);
    const leftMatches = groupedRoundMatches.slice(0, middle);
    const rightMatches = groupedRoundMatches.slice(middle);

    const targetPerSide = 2 ** Math.max(stageRounds.length - 1 - stageIndex, 0);

    while (leftMatches.length < targetPerSide) {
      leftMatches.push(
        createPlaceholderMatch(round, 'left', leftMatches.length),
      );
    }

    while (rightMatches.length < targetPerSide) {
      rightMatches.push(
        createPlaceholderMatch(round, 'right', rightMatches.length),
      );
    }

    leftByRound[round] = leftMatches;
    rightByRound[round] = rightMatches;
  });

  const renderMatchCard = (
    match: Match,
    options?: {
      isFinal?: boolean;
    },
  ) => {
    const stateConfig = getStateDisplay(match.state);
    const hasScore =
      match.team1Score !== null &&
      match.team1Score !== undefined &&
      match.team2Score !== null &&
      match.team2Score !== undefined;
    const isBye = isByeMatch(match);
    const byeQualifiedTeamName =
      match.byeTeamId !== undefined ? teamNameById[match.byeTeamId] : undefined;
    const displayedByeTeamName =
      match.team1Name || match.team2Name || byeQualifiedTeamName;
    const isFinal = Boolean(options?.isFinal);
    const isGroupedByeMatch = Boolean(match.groupedFromBye);

    const isReal = match.matchId > 0;
    return (
      <Box
        data-testid={isReal ? `bracket-match-${match.matchId}` : undefined}
        onClick={
          isReal
            ? (e) => {
                if (
                  !(e.currentTarget as HTMLElement).contains(
                    e.target as HTMLElement,
                  )
                )
                  return;
                if ((e.target as HTMLElement).closest('button')) return;
                navigate(
                  `/tournaments/${tournamentId}/matches/${match.matchId}/selections`,
                );
              }
            : undefined
        }
        sx={{
          position: 'relative',
          minHeight: `${cardMinHeight}px`,
          border: isFinal
            ? '2px solid rgba(250, 212, 52, 0.98)'
            : '2px solid rgba(255,255,255,0.9)',
          borderRadius: 1.2,
          px: 1.2,
          py: 1,
          backgroundColor: isFinal
            ? 'rgba(250, 212, 52, 0.95)'
            : 'rgba(12, 19, 34, 0.84)',
          color: isFinal ? '#121824' : '#f7f8fa',
          cursor: isReal ? 'pointer' : 'default',
        }}
      >
        {isGroupedByeMatch && (
          <Chip
            label="Regroupe BYE"
            size="small"
            data-testid="grouped-bye-badge"
            sx={{
              position: 'absolute',
              top: 6,
              right: 6,
              height: 20,
              fontSize: '0.66rem',
              fontWeight: 700,
              backgroundColor: 'rgba(107, 128, 161, 0.22)',
              color: isFinal ? '#1d2639' : '#cfdefa',
              border: '1px solid rgba(174, 194, 229, 0.5)',
            }}
          />
        )}

        {isFinal && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 0.4,
            }}
          >
            <EmojiEventsIcon
              sx={{
                color: '#1b2233',
                fontSize: 20,
              }}
            />
          </Box>
        )}

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 1,
            mb: 0.75,
            fontSize: '0.85rem',
          }}
        >
          <Typography sx={{ fontSize: 'inherit', fontWeight: 600 }}>
            {isBye
              ? `${displayedByeTeamName || 'Bye'} (BYE)`
              : match.team1Name || '-'}
          </Typography>
          <Typography sx={{ fontSize: 'inherit', fontWeight: 700 }}>
            {hasScore ? match.team1Score : '-'}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 1,
            fontSize: '0.85rem',
          }}
        >
          <Typography sx={{ fontSize: 'inherit', fontWeight: 600 }}>
            {isBye ? displayedByeTeamName || '-' : match.team2Name || '-'}
          </Typography>
          <Typography sx={{ fontSize: 'inherit', fontWeight: 700 }}>
            {hasScore ? match.team2Score : '-'}
          </Typography>
        </Box>

        <Box
          sx={{
            mt: 1,
            pt: 0.8,
            borderTop: isFinal
              ? '1px dashed rgba(18, 24, 36, 0.45)'
              : '1px dashed rgba(255,255,255,0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1,
          }}
        >
          <Typography
            sx={{
              fontSize: '0.72rem',
              color: isFinal ? '#1e2840' : '#a8b6d8',
              fontWeight: isFinal ? 700 : 500,
            }}
          >
            {formatDateTime(match.startTime)}
          </Typography>
          <Chip
            label={stateConfig.label}
            color={
              stateConfig.color as
                | 'default'
                | 'error'
                | 'info'
                | 'success'
                | 'warning'
            }
            size="small"
            sx={{
              height: 22,
              fontWeight: 700,
              border: isFinal ? '1px solid rgba(18, 24, 36, 0.35)' : undefined,
            }}
          />
        </Box>
        <EncoderResultButton
          match={match}
          tournamentId={tournamentId}
          onSuccess={onSuccess}
        />
      </Box>
    );
  };

  const firstStageRound = stageRounds[0];
  const leftFirstRoundCount = firstStageRound
    ? leftByRound[firstStageRound]!.length
    : 0;
  const rightFirstRoundCount = firstStageRound
    ? rightByRound[firstStageRound]!.length
    : 0;
  const globalFirstRoundCount = Math.max(
    leftFirstRoundCount,
    rightFirstRoundCount,
    1,
  );
  const rowStep = cardMinHeight + cardGap;
  const contentHeight = Math.max(
    cardMinHeight,
    globalFirstRoundCount * rowStep - cardGap,
  );
  const diagramHeight = labelAreaHeight + contentHeight + 16;
  const sideWidth =
    stageRounds.length > 0
      ? stageRounds.length * columnWidth + (stageRounds.length - 1) * columnGap
      : columnWidth;
  const finalColumnWidth = 204;
  const centerGap = 140;
  const finalX = sideWidth + centerGap;
  const rightBaseX = finalX + finalColumnWidth + centerGap;
  const diagramWidth = rightBaseX + sideWidth;
  const finalCenterY = labelAreaHeight + contentHeight / 2;
  const finalTop = finalCenterY - cardMinHeight / 2;

  const buildSideLayouts = (side: BracketSide): SideColumnLayout[] => {
    const roundMap = side === 'left' ? leftByRound : rightByRound;
    const firstCount = roundMap[firstStageRound as number]!.length;
    const sideOffset = ((globalFirstRoundCount - firstCount) * rowStep) / 2;

    return stageRounds.reduce<SideColumnLayout[]>((acc, round, index) => {
      const stageMatches = roundMap[round]!;
      const x =
        side === 'left'
          ? index * (columnWidth + columnGap)
          : rightBaseX +
            (stageRounds.length - 1 - index) * (columnWidth + columnGap);

      const yPositions =
        index === 0
          ? stageMatches.map(
              (_match, matchIndex) =>
                labelAreaHeight + sideOffset + matchIndex * rowStep,
            )
          : stageMatches.map((_match, matchIndex) => {
              const previous = acc[index - 1].yPositions;
              const sourceA =
                previous[Math.min(matchIndex * 2, previous.length - 1)];
              const sourceB =
                previous[Math.min(matchIndex * 2 + 1, previous.length - 1)];
              return (sourceA + sourceB) / 2;
            });

      acc.push({ round, matches: stageMatches, x, yPositions });
      return acc;
    }, []);
  };

  const leftLayouts = stageRounds.length > 0 ? buildSideLayouts('left') : [];
  const rightLayouts = stageRounds.length > 0 ? buildSideLayouts('right') : [];

  const renderHorizontalLine = (
    key: string,
    x1: number,
    x2: number,
    y: number,
  ) => (
    <Box
      key={key}
      sx={{
        position: 'absolute',
        left: Math.min(x1, x2),
        top: y,
        width: Math.abs(x2 - x1),
        borderTop: `2px solid ${lineColor}`,
        zIndex: 1,
      }}
    />
  );

  const renderVerticalLine = (
    key: string,
    x: number,
    y1: number,
    y2: number,
  ) => (
    <Box
      key={key}
      sx={{
        position: 'absolute',
        left: x,
        top: Math.min(y1, y2),
        height: Math.abs(y2 - y1),
        borderLeft: `2px solid ${lineColor}`,
        zIndex: 1,
      }}
    />
  );

  const renderSideConnectors = (
    layouts: SideColumnLayout[],
    side: BracketSide,
  ) =>
    layouts.flatMap((column, columnIndex) => {
      if (columnIndex >= layouts.length - 1) {
        return [];
      }

      const nextColumn = layouts[columnIndex + 1];

      return nextColumn.yPositions.flatMap((nextTop, nextIndex) => {
        const currentAIndex = Math.min(
          nextIndex * 2,
          column.yPositions.length - 1,
        );
        const currentBIndex = Math.min(
          nextIndex * 2 + 1,
          column.yPositions.length - 1,
        );
        const yA = column.yPositions[currentAIndex] + cardMinHeight / 2;
        const yB = column.yPositions[currentBIndex] + cardMinHeight / 2;
        const yNext = nextTop + cardMinHeight / 2;

        if (side === 'left') {
          const currentEdge = column.x + columnWidth;
          const nextEdge = nextColumn.x;
          const midX = currentEdge + columnGap / 2;

          return [
            renderHorizontalLine(
              `l-ha-${columnIndex}-${nextIndex}`,
              currentEdge,
              midX,
              yA,
            ),
            renderHorizontalLine(
              `l-hb-${columnIndex}-${nextIndex}`,
              currentEdge,
              midX,
              yB,
            ),
            renderVerticalLine(`l-v-${columnIndex}-${nextIndex}`, midX, yA, yB),
            renderHorizontalLine(
              `l-hn-${columnIndex}-${nextIndex}`,
              midX,
              nextEdge,
              yNext,
            ),
          ];
        }

        const currentEdge = column.x;
        const nextEdge = nextColumn.x + columnWidth;
        const midX = currentEdge - columnGap / 2;

        return [
          renderHorizontalLine(
            `r-ha-${columnIndex}-${nextIndex}`,
            midX,
            currentEdge,
            yA,
          ),
          renderHorizontalLine(
            `r-hb-${columnIndex}-${nextIndex}`,
            midX,
            currentEdge,
            yB,
          ),
          renderVerticalLine(`r-v-${columnIndex}-${nextIndex}`, midX, yA, yB),
          renderHorizontalLine(
            `r-hn-${columnIndex}-${nextIndex}`,
            nextEdge,
            midX,
            yNext,
          ),
        ];
      });
    });

  const renderFinalConnectors = (
    layouts: SideColumnLayout[],
    side: BracketSide,
  ) => {
    const innerColumn = layouts[layouts.length - 1];
    const finalLeftEdge = finalX;
    const finalRightEdge = finalX + finalColumnWidth;

    return innerColumn.yPositions.flatMap((top, index) => {
      const y = top + cardMinHeight / 2;
      const midX =
        side === 'left'
          ? innerColumn.x + columnWidth + centerGap / 2
          : innerColumn.x - centerGap / 2;
      const innerEdge =
        side === 'left' ? innerColumn.x + columnWidth : innerColumn.x;

      if (side === 'left') {
        return [
          renderHorizontalLine(`lf-hi-${index}`, innerEdge, midX, y),
          renderVerticalLine(`lf-v-${index}`, midX, y, finalCenterY),
          renderHorizontalLine(
            `lf-hf-${index}`,
            midX,
            finalLeftEdge,
            finalCenterY,
          ),
        ];
      }

      return [
        renderHorizontalLine(`rf-hi-${index}`, midX, innerEdge, y),
        renderVerticalLine(`rf-v-${index}`, midX, y, finalCenterY),
        renderHorizontalLine(
          `rf-hf-${index}`,
          finalRightEdge,
          midX,
          finalCenterY,
        ),
      ];
    });
  };

  return (
    <Paper
      sx={{
        p: { xs: 1, md: 2 },
        borderRadius: 3,
        background:
          'radial-gradient(circle at 20% 10%, rgba(236, 202, 80, 0.16), transparent 25%), radial-gradient(circle at 80% 85%, rgba(153, 179, 224, 0.18), transparent 25%), linear-gradient(145deg, #0f1424 0%, #151b30 45%, #101729 100%)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        color: '#f7f8fa',
        overflowX: 'auto',
        overflowY: 'auto',
        position: 'relative',
        height: '100%',
        '&::before': {
          content: '""',
          position: 'absolute',
          inset: 0,
          background:
            'repeating-linear-gradient(125deg, rgba(255,255,255,0.03) 0 2px, transparent 2px 9px)',
          pointerEvents: 'none',
          opacity: 0.35,
        },
      }}
    >
      <Box
        sx={{
          width: `${diagramWidth}px`,
          height: `${diagramHeight}px`,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {stageRounds.length > 0 ? (
          <>
            {renderSideConnectors(leftLayouts, 'left')}
            {renderSideConnectors(rightLayouts, 'right')}
            {renderFinalConnectors(leftLayouts, 'left')}
            {renderFinalConnectors(rightLayouts, 'right')}

            {leftLayouts.map((layout) => (
              <Box key={`left-label-${layout.round}`}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    position: 'absolute',
                    left: layout.x + columnWidth / 2,
                    transform: 'translateX(-50%)',
                    top: Math.max(2, (layout.yPositions[0] as number) - 34),
                    width: 'fit-content',
                    whiteSpace: 'nowrap',
                    px: 1,
                    py: 0.4,
                    borderRadius: 1,
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    color: '#e9efff',
                    border: '1px solid rgba(255,255,255,0.4)',
                    backgroundColor: 'rgba(8, 14, 27, 0.55)',
                    zIndex: 3,
                  }}
                >
                  {getRoundLabel(layout.round, totalRounds)}
                </Typography>
                {layout.matches.map((match, matchIndex) => (
                  <Box
                    key={`left-card-${layout.round}-${match.matchId}`}
                    sx={{
                      position: 'absolute',
                      left: layout.x,
                      top: layout.yPositions[matchIndex],
                      width: `${columnWidth}px`,
                      zIndex: bracketMatchZIndex(
                        layout.round,
                        matchIndex,
                        layout.matches.length,
                      ),
                    }}
                  >
                    {renderMatchCard(match)}
                  </Box>
                ))}
              </Box>
            ))}

            {rightLayouts.map((layout) => (
              <Box key={`right-label-${layout.round}`}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    position: 'absolute',
                    left: layout.x + columnWidth / 2,
                    transform: 'translateX(-50%)',
                    top: Math.max(2, (layout.yPositions[0] as number) - 34),
                    width: 'fit-content',
                    whiteSpace: 'nowrap',
                    px: 1,
                    py: 0.4,
                    borderRadius: 1,
                    fontWeight: 700,
                    letterSpacing: 0.4,
                    color: '#e9efff',
                    border: '1px solid rgba(255,255,255,0.4)',
                    backgroundColor: 'rgba(8, 14, 27, 0.55)',
                    zIndex: 3,
                  }}
                >
                  {getRoundLabel(layout.round, totalRounds)}
                </Typography>
                {layout.matches.map((match, matchIndex) => (
                  <Box
                    key={`right-card-${layout.round}-${match.matchId}`}
                    sx={{
                      position: 'absolute',
                      left: layout.x,
                      top: layout.yPositions[matchIndex],
                      width: `${columnWidth}px`,
                      zIndex: bracketMatchZIndex(
                        layout.round,
                        matchIndex,
                        layout.matches.length,
                      ),
                    }}
                  >
                    {renderMatchCard(match)}
                  </Box>
                ))}
              </Box>
            ))}

            <Typography
              variant="subtitle2"
              sx={{
                position: 'absolute',
                left: finalX + finalColumnWidth / 2,
                transform: 'translateX(-50%)',
                top: Math.max(2, finalTop - 34),
                width: 'fit-content',
                whiteSpace: 'nowrap',
                px: 1,
                py: 0.4,
                borderRadius: 1,
                fontWeight: 700,
                letterSpacing: 0.4,
                color: '#ffe98d',
                border: '1px solid rgba(250, 212, 52, 0.7)',
                backgroundColor: 'rgba(250, 212, 52, 0.2)',
                zIndex: 3,
              }}
            >
              {getRoundLabel(finalRound, totalRounds)}
            </Typography>

            {matchesByRound[finalRound].map((match, matchIndex) => (
              <Box
                key={`final-card-${match.matchId}`}
                sx={{
                  position: 'absolute',
                  left: finalX,
                  top: finalTop + matchIndex * rowStep,
                  width: `${finalColumnWidth}px`,
                  zIndex: bracketMatchZIndex(
                    finalRound,
                    matchIndex,
                    matchesByRound[finalRound].length,
                  ),
                }}
              >
                {renderMatchCard(match, { isFinal: true })}
              </Box>
            ))}
          </>
        ) : (
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: labelAreaHeight,
              width: `${finalColumnWidth}px`,
              zIndex: 2,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                width: 'fit-content',
                alignSelf: 'center',
                px: 1,
                py: 0.4,
                borderRadius: 1,
                fontWeight: 700,
                letterSpacing: 0.4,
                color: '#ffe98d',
                border: '1px solid rgba(250, 212, 52, 0.7)',
                backgroundColor: 'rgba(250, 212, 52, 0.2)',
              }}
            >
              {getRoundLabel(finalRound, totalRounds)}
            </Typography>
            {matchesByRound[finalRound].map((match) => (
              <Box key={`only-final-card-${match.matchId}`}>
                {renderMatchCard(match, { isFinal: true })}
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Paper>
  );
};

export default ScheduleBracket;
