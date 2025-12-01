'use client';

import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Circle } from 'lucide-react';

interface RadioFiltersProps {
  searchTerm: string;
  selectedRegion: string;
  selectedGenre: string;
  selectedPlatform: string;
  regions: string[];
  genres: string[];
  platforms: string[];
  onSearchChange: (value: string) => void;
  onRegionChange: (value: string) => void;
  onGenreChange: (value: string) => void;
  onPlatformChange: (value: string) => void;
  getPlatformIcon: (platform: string) => JSX.Element;
  getPlatformName: (platform: string) => string;
}

export function RadioFilters({
  searchTerm,
  selectedRegion,
  selectedGenre,
  selectedPlatform,
  regions,
  genres,
  platforms,
  onSearchChange,
  onRegionChange,
  onGenreChange,
  onPlatformChange,
  getPlatformIcon,
  getPlatformName,
}: RadioFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="relative flex-1">
        <Search className="absolute left-2 top-2.5 h-4 w-4" style={{ color: '#9ca3af' }} />
        <Input
          placeholder="Buscar radios..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 bg-gray-800 border-gray-700 text-white"
        />
      </div>
      
      {/* Leyenda de colores de estado - ELIMINADA */}
      
      <Select value={selectedRegion} onValueChange={onRegionChange}>
        <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700 text-white">
          <SelectValue placeholder="Selecciona una región" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          {regions.map(region => (
            <SelectItem key={region} value={region} className="text-white hover:bg-gray-700">
              {region}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={selectedGenre} onValueChange={onGenreChange}>
        <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700 text-white">
          <SelectValue placeholder="Todos los géneros" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          <SelectItem value="all" className="text-white hover:bg-gray-700">Todos los géneros</SelectItem>
          {genres.map(genre => (
            <SelectItem key={genre} value={genre} className="text-white hover:bg-gray-700">
              {genre}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select value={selectedPlatform} onValueChange={onPlatformChange}>
        <SelectTrigger className="w-[200px] bg-gray-800 border-gray-700 text-white">
          <SelectValue placeholder="Todas las plataformas" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          <SelectItem value="all" className="text-white hover:bg-gray-700">Todas las plataformas</SelectItem>
          {platforms.map(platform => (
            <SelectItem key={platform} value={platform} className="text-white hover:bg-gray-700">
              <div className="flex items-center space-x-2">
                {getPlatformIcon(platform)}
                <span className="text-white">{getPlatformName(platform)}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
