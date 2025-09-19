import React, { useState, useMemo } from 'react';

export interface Incident {
  _id: string;
  type: string;
  severity: string;
  status: string;
  description?: string;
  createdAt: string;
}

interface Props { 
  incidents: Incident[]; 
  onAck: (id: string) => void; 
}

export const EnhancedIncidentTable: React.FC<Props> = ({ incidents, onAck }) => {
  const [sortField, setSortField] = useState<keyof Incident>('createdAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-semibold uppercase";
    
    switch (status) {
      case 'open':
        return <span className={`${baseClasses} bg-red-500/20 text-red-300 border border-red-500/30`}>Open</span>;
      case 'acknowledged':
        return <span className={`${baseClasses} bg-yellow-500/20 text-yellow-300 border border-yellow-500/30`}>Acknowledged</span>;
      case 'resolved':
        return <span className={`${baseClasses} bg-green-500/20 text-green-300 border border-green-500/30`}>Resolved</span>;
      default:
        return <span className={`${baseClasses} bg-gray-500/20 text-gray-300 border border-gray-500/30`}>{status}</span>;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const handleSort = (field: keyof Incident) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof Incident) => {
    if (field !== sortField) return '↕️';
    return sortDirection === 'asc' ? '⬆️' : '⬇️';
  };

  const filteredAndSortedIncidents = useMemo(() => {
    let filtered = incidents.filter(incident => {
      const matchesSearch = !searchTerm || 
        incident.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.severity.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
      const matchesType = typeFilter === 'all' || incident.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    // Sort the filtered results
    filtered.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];
      
      if (sortField === 'createdAt') {
        aVal = new Date(aVal as string).getTime();
        bVal = new Date(bVal as string).getTime();
      }
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      // Handle undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return sortDirection === 'asc' ? -1 : 1;
      if (bVal == null) return sortDirection === 'asc' ? 1 : -1;
      
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [incidents, searchTerm, statusFilter, typeFilter, sortField, sortDirection]);

  const totalPages = Math.ceil(filteredAndSortedIncidents.length / itemsPerPage);
  const paginatedIncidents = filteredAndSortedIncidents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const uniqueTypes = [...new Set(incidents.map(i => i.type))];
  const uniqueStatuses = [...new Set(incidents.map(i => i.status))];

  return (
    <div className="space-y-4">
      {/* Enhanced Filters and Search */}
      <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-600/30">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <div className="absolute right-3 top-2.5 text-slate-500">
                🔍
              </div>
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-600/50 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Types</option>
              {uniqueTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Results Summary */}
          <div className="flex items-end">
            <div className="text-sm text-slate-400">
              <div className="font-semibold text-slate-300">
                {filteredAndSortedIncidents.length} of {incidents.length}
              </div>
              <div className="text-xs">incidents found</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Table */}
      <div className="bg-slate-800/30 rounded-xl border border-slate-600/30 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-800/50 border-b border-slate-600/30">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700/30 transition-colors"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center gap-2">
                    Type
                    <span className="text-slate-500">{getSortIcon('type')}</span>
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700/30 transition-colors"
                  onClick={() => handleSort('severity')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Severity
                    <span className="text-slate-500">{getSortIcon('severity')}</span>
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700/30 transition-colors"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center justify-center gap-2">
                    Status
                    <span className="text-slate-500">{getSortIcon('status')}</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Description
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider cursor-pointer hover:bg-slate-700/30 transition-colors"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-2">
                    Time
                    <span className="text-slate-500">{getSortIcon('createdAt')}</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/30">
              {paginatedIncidents.map((incident) => (
                <tr 
                  key={incident._id}
                  className="hover:bg-slate-700/20 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                        <span className="text-sm">
                          {incident.type === 'panic' ? '🚨' : incident.type === 'anomaly' ? '⚠️' : '📍'}
                        </span>
                      </div>
                      <span className="font-medium text-slate-200 capitalize">{incident.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-base">{getSeverityIcon(incident.severity)}</span>
                      <span className={`font-semibold capitalize ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {getStatusBadge(incident.status)}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="text-sm text-slate-300 truncate" title={incident.description || 'No description'}>
                      {incident.description || 'No description'}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-slate-300">
                      {new Date(incident.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-slate-500">
                      {new Date(incident.createdAt).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {incident.status === 'open' && (
                      <button 
                        onClick={() => onAck(incident._id)}
                        className="px-3 py-1.5 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white text-xs font-semibold rounded-lg transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500/50"
                      >
                        Acknowledge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-slate-800/30 border-t border-slate-600/30 flex items-center justify-between">
            <div className="text-sm text-slate-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedIncidents.length)} of {filteredAndSortedIncidents.length} results
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-lg text-sm hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 bg-slate-700/50 text-slate-300 rounded-lg text-sm hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredAndSortedIncidents.length === 0 && (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4 opacity-50">📊</div>
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No incidents found</h3>
            <p className="text-slate-500 mb-4">
              {incidents.length === 0 
                ? "No incidents have been reported yet"
                : "Try adjusting your search criteria or filters"
              }
            </p>
            {(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                  setTypeFilter('all');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};