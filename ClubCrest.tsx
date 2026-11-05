import React from 'react';
import clubCrestData from './assets/club-crest-data';

const clubCrests: Record<string, string> = {
  'Arsenal': 'arsenal',
  'Brighton & Hove Albion': 'brighton',
  'Liverpool': 'liverpool',
  'Manchester United': 'man-utd',
  'Real Madrid': 'real-madrid',
  'FC Bayern München': 'bayern',
  'Borussia Dortmund': 'borussia-dortmund',
  'Manchester City': 'man-city',
  'Tottenham Hotspur': 'tottenham',
  'Toulouse FC': 'toulouse',
  'RC Strasbourg Alsace': 'strasbourg',
  'Sevilla FC': 'sevilla',
  'Inter Milan': 'inter',
  'SSC Napoli': 'napoli',
  'AC Milan': 'ac-milan',
};

export default function ClubCrest({ club, className = '' }: { club: string; className?: string }) {
  return <img className={`club-crest ${className}`} data-club={clubCrests[club]} src={clubCrestData[clubCrests[club]]} alt="" aria-hidden="true" width={32} height={32} decoding="async" draggable={false} />;
}
