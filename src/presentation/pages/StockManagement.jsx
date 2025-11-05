import { useEffect, useMemo, useState } from 'react';
import { useHighlight } from '../hooks/useHighlight';
// ✅ Clean Architecture: Sử dụng Custom Hooks
import { useStockAssets } from '../hooks/useStockAssets';
import { useStockBalances } from '../hooks/useStockBalances';
import { useProjects } from '../hooks/useProjects';
import { useLocations } from '../hooks/useLocations';
// ❌ TODO: stockTransactions và helper functions vẫn import trực tiếp
import { 
  listStockTransactions,
  getTransactionStatusColor,
  getTransactionStatusText,
  calculateTransactionTotalQuantity,
  getTransactionSummaryByStatus
} from '../../infrastructure/repositories/stockTransactionsRepository';
import { 
  calculateTotalValue,
  isAssetExpired,
  getAssetsExpiringSoon
} from '../../infrastructure/repositories/stockAssetsRepository';
import { 
  calculateTotalStockValue,
  calculateAvailableStock,
  getLowStockItems,
  getStockMovementSummary
} from '../../infrastructure/repositories/stockBalancesRepository';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../components/common/Toaster';
import { confirm } from '../components/common/ConfirmDialog';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Package, 
  Warehouse, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Hash, 
  Eye,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  BarChart3,
  Activity
} from 'lucide-react';
import { Pagination } from 'antd';

const defaultAssetForm = { 
  name: '', 
  sku: '', 
  description: '', 
  type: '', 
  brandFamilyCode: '',
  clientId: '', 
  clientName: '', 
  orgId: '', 
  projectId: '', 
  pack: '', 
  unit: '', 
  unitPerPack: 1,
  unitPerBundle: 1,
  unitPrice: 0,
  packPrice: 0,
  packHeight: 0,
  packLength: 0,
  packWeight: 0,
  packWidth: 0,
  mfgDate: '', 
  expDate: '', 
  available: true,
  tags: [],
  photos: []
};

const defaultBalanceForm = { 
  assetId: '', 
  assetName: '', 
  assetSku: '', 
  warehouseId: '', 
  warehouseName: '', 
  orgId: '', 
  projectId: '', 
  unitQty: 0,
  inboundUnitQty: 0,
  outboundUnitQty: 0,
  bookedUnitQty: 0,
  shrinkageUnitQty: 0,
  pack: '', 
  unit: '', 
  unitPerPack: 1,
  unitPerBundle: 1
};

export default function StockManagement() {
  const { currentUser, accessibleProjects } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  
  // ✅ Clean Architecture: Sử dụng Custom Hooks
  const {
    assets,
    loading: assetsLoading,
    createAsset: createAssetHook,
    updateAsset: updateAssetHook,
    deleteAsset: deleteAssetHook,
    refresh: refreshAssets
  } = useStockAssets({ accessibleProjectIds: accessibleProjects });

  const {
    balances,
    loading: balancesLoading,
    createBalance: createBalanceHook,
    updateBalance: updateBalanceHook,
    deleteBalance: deleteBalanceHook,
    refresh: refreshBalances
  } = useStockBalances({ accessibleProjectIds: accessibleProjects });

  const {
    projects,
    loading: projectsLoading
  } = useProjects({ accessibleProjectIds: accessibleProjects });

  const {
    locations,
    loading: locationsLoading
  } = useLocations({ accessibleProjectIds: accessibleProjects });

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [showAssetForm, setShowAssetForm] = useState(false);
  const [showBalanceForm, setShowBalanceForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);
  const [editingBalance, setEditingBalance] = useState(null);
  const [assetForm, setAssetForm] = useState(defaultAssetForm);
  const [balanceForm, setBalanceForm] = useState(defaultBalanceForm);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);

  const filteredAssets = useMemo(() => {
    if (!search) return assets;
    const s = search.toLowerCase();
    return assets.filter(asset => 
      (asset.keywords || []).some(k => k.includes(s)) || 
      (asset.name || '').toLowerCase().includes(s) ||
      (asset.sku || '').toLowerCase().includes(s) ||
      (asset.description || '').toLowerCase().includes(s)
    );
  }, [assets, search]);

  const filteredBalances = useMemo(() => {
    if (!search) return balances;
    const s = search.toLowerCase();
    return balances.filter(balance => 
      (balance.keywords || []).some(k => k.includes(s)) || 
      (balance.assetName || '').toLowerCase().includes(s) ||
      (balance.assetSku || '').toLowerCase().includes(s) ||
      (balance.warehouseName || '').toLowerCase().includes(s)
    );
  }, [balances, search]);

  const filteredTransactions = useMemo(() => {
    if (!search) return transactions;
    const s = search.toLowerCase();
    return transactions.filter(transaction => 
      (transaction.keywords || []).some(k => k.includes(s)) || 
      (transaction.notes || '').toLowerCase().includes(s) ||
      (transaction.fromWarehouseName || '').toLowerCase().includes(s) ||
      (transaction.toWarehouseName || '').toLowerCase().includes(s)
    );
  }, [transactions, search]);

  // Pagination logic
  const getPaginatedItems = (items) => {
    const totalPages = Math.ceil(items.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return items.slice(startIndex, endIndex);
  };

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const load = async () => {
    setLoading(true);
    try {
      // ✅ Assets, Balances, Projects, và Locations được load tự động bởi hooks
      // Chỉ cần load transactions
      const transactionList = await listStockTransactions();
      setTransactions(transactionList);
    } catch (error) {
      console.error('Error loading stock management data:', error);
      setError('Không thể tải dữ liệu. Vui lòng thử lại sau.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [assets, balances, projects, locations]); // ✅ Reload khi data thay đổi

  const formatDateTime = (timestamp) => {
    if (!timestamp) return '-';
    
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return '-';
    }
    
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    let date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'string') {
      date = new Date(timestamp);
    } else if (typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return '';
    }
    if (isNaN(date.getTime())) return '';
    return date.toISOString().split('T')[0];
  };

  // Statistics calculations
  const totalAssetValue = calculateTotalValue(assets);
  const totalStockValue = calculateTotalStockValue(balances, assets);
  const lowStockItems = getLowStockItems(balances, 10);
  const expiringSoon = getAssetsExpiringSoon(assets, 30);
  const expiredAssets = assets.filter(asset => isAssetExpired(asset.expDate));
  const movementSummary = getStockMovementSummary(balances);
  const transactionSummary = getTransactionSummaryByStatus(transactions);

  const tabs = [
    { id: 'overview', name: 'Tổng quan', icon: BarChart3 },
    { id: 'assets', name: 'Tài sản kho', icon: Package },
    { id: 'balances', name: 'Số dư kho', icon: Warehouse },
    { id: 'transactions', name: 'Giao dịch', icon: Activity }
  ];

  // Component for balance row to avoid hook violation
  const BalanceRow = ({ balance }) => {
    const { isHighlighted } = useHighlight(balance.id, 'stock');
    
    return (
      <tr 
        id={`item-${balance.id}`}
        className={`border-t hover:bg-gray-50 ${
          isHighlighted ? 'bg-yellow-100 border-l-4 border-yellow-500 animate-pulse' : ''
        }`}
      >
        <td className="px-4 py-2">
          <div className="font-medium">{balance.assetName}</div>
          <div className="text-sm text-gray-500">{balance.assetSku}</div>
        </td>
        <td className="px-4 py-2">
          <span className="text-sm">{balance.warehouseName || '-'}</span>
        </td>
        <td className="px-4 py-2">
          <span className="font-semibold">{balance.unitQty || 0}</span>
          <span className="text-sm text-gray-500 ml-1">{balance.unit}</span>
        </td>
        <td className="px-4 py-2">
          <span className={`font-semibold ${
            calculateAvailableStock(balance) < 10 ? 'text-red-600' : 'text-green-600'
          }`}>
            {calculateAvailableStock(balance)}
          </span>
          <span className="text-sm text-gray-500 ml-1">{balance.unit}</span>
        </td>
        <td className="px-4 py-2">
          <span className="text-sm">{balance.bookedUnitQty || 0}</span>
          <span className="text-sm text-gray-500 ml-1">{balance.unit}</span>
        </td>
        <td className="px-4 py-2">
          <div className="text-sm">
            <div className="text-green-600">+{balance.inboundUnitQty || 0}</div>
            <div className="text-red-600">-{balance.outboundUnitQty || 0}</div>
          </div>
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                setEditingBalance(balance);
                setBalanceForm({
                  assetId: balance.assetId || '',
                  assetName: balance.assetName || '',
                  assetSku: balance.assetSku || '',
                  warehouseId: balance.warehouseId || '',
                  warehouseName: balance.warehouseName || '',
                  orgId: balance.orgId || '',
                  projectId: balance.projectId || '',
                  unitQty: balance.unitQty || 0,
                  inboundUnitQty: balance.inboundUnitQty || 0,
                  outboundUnitQty: balance.outboundUnitQty || 0,
                  bookedUnitQty: balance.bookedUnitQty || 0,
                  shrinkageUnitQty: balance.shrinkageUnitQty || 0,
                  pack: balance.pack || '',
                  unit: balance.unit || '',
                  unitPerPack: balance.unitPerPack || 1,
                  unitPerBundle: balance.unitPerBundle || 1
                });
                setShowBalanceForm(true);
              }} 
              className="p-2 hover:bg-gray-100 rounded"
              title="Chỉnh sửa"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button 
              onClick={async () => {
                const confirmed = await confirm('Xóa số dư này?');
                if (confirmed) {
                  try {
                    // ✅ Clean Architecture: Sử dụng hook method
                    await deleteBalanceHook(balance.id);
                    await load(); // Reload transactions
                    // ✅ Toast message đã được handle trong hook
                  } catch (error) {
                    // Error đã được handle trong hook
                    console.error('Error in deleteBalance:', error);
                  }
                }
              }} 
              className="p-2 hover:bg-gray-100 rounded text-red-600"
              title="Xóa"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  if (loading || assetsLoading || balancesLoading || projectsLoading || locationsLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold flex items-center">
            <Package className="w-6 h-6 mr-2 text-indigo-600" />
            Quản lý kho hàng
          </h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold flex items-center">
            <Package className="w-6 h-6 mr-2 text-indigo-600" />
            Quản lý kho hàng
          </h1>
        </div>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="bg-red-100 rounded-full p-4 mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <p className="text-red-600 font-medium">{error}</p>
            <button 
              onClick={() => {
                setError(null);
                load();
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              Thử lại
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold flex items-center">
          <Package className="w-6 h-6 mr-2 text-indigo-600" />
          Quản lý kho hàng
        </h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Tìm kiếm..." 
            className="w-full border rounded-lg pl-10 pr-3 py-2" 
          />
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Tổng giá trị tài sản</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {totalAssetValue.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Warehouse className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Tổng giá trị kho</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {totalStockValue.toLocaleString('vi-VN')}đ
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Hàng sắp hết</p>
                  <p className="text-lg font-semibold text-gray-900">{lowStockItems.length}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <Clock className="w-5 h-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-600">Sắp hết hạn</p>
                  <p className="text-lg font-semibold text-gray-900">{expiringSoon.length}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Movement Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Tổng quan chuyển động kho
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Nhập kho:</span>
                  <span className="font-semibold text-green-600 flex items-center">
                    <ArrowUp className="w-4 h-4 mr-1" />
                    {movementSummary.totalInbound}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Xuất kho:</span>
                  <span className="font-semibold text-red-600 flex items-center">
                    <ArrowDown className="w-4 h-4 mr-1" />
                    {movementSummary.totalOutbound}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Hao hụt:</span>
                  <span className="font-semibold text-orange-600">
                    {movementSummary.totalShrinkage}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Đã đặt:</span>
                  <span className="font-semibold text-blue-600">
                    {movementSummary.totalBooked}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Trạng thái giao dịch
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Hoàn thành:</span>
                  <span className="font-semibold text-green-600">{transactionSummary.completed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Chờ xử lý:</span>
                  <span className="font-semibold text-yellow-600">{transactionSummary.pending}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Đang xử lý:</span>
                  <span className="font-semibold text-blue-600">{transactionSummary.in_progress}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Đã hủy:</span>
                  <span className="font-semibold text-red-600">{transactionSummary.cancelled}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts */}
          {(lowStockItems.length > 0 || expiringSoon.length > 0 || expiredAssets.length > 0) && (
            <div className="bg-white p-4 rounded-lg shadow-sm border">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-red-600">
                <AlertTriangle className="w-5 h-5 mr-2" />
                Cảnh báo
              </h3>
              <div className="space-y-2">
                {lowStockItems.length > 0 && (
                  <div className="flex items-center text-sm text-yellow-700">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {lowStockItems.length} sản phẩm sắp hết hàng
                  </div>
                )}
                {expiringSoon.length > 0 && (
                  <div className="flex items-center text-sm text-orange-700">
                    <Clock className="w-4 h-4 mr-2" />
                    {expiringSoon.length} sản phẩm sắp hết hạn trong 30 ngày
                  </div>
                )}
                {expiredAssets.length > 0 && (
                  <div className="flex items-center text-sm text-red-700">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {expiredAssets.length} sản phẩm đã hết hạn
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Assets Tab */}
      {activeTab === 'assets' && (
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Tài sản kho</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    value={search}
                    onChange={(e)=>setSearch(e.target.value)}
                    placeholder="Tìm kiếm tài sản..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <button 
                  onClick={() => { setShowAssetForm(true); setEditingAsset(null); setAssetForm(defaultAssetForm); }} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm tài sản</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Tên sản phẩm</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Loại</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Đơn vị</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Giá</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Hạn sử dụng</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="w-24 px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedItems(filteredAssets).map((asset) => (
                    <tr key={asset.id} className="border-t hover:bg-gray-50">
                      {/* keep existing row cells but adjust paddings to px-6 py-4 */}
                      <td className="px-6 py-4">
                        <div className="font-medium">{asset.name}</div>
                        <div className="text-sm text-gray-500">{asset.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">{asset.sku || '-'}</span>
                      </td>
                      <td className="px-6 py-4"><span className="text-sm">{asset.type || '-'}</span></td>
                      <td className="px-6 py-4"><span className="text-sm font-medium">{asset.pack || '-'}</span></td>
                      <td className="px-6 py-4"><span className="text-sm font-semibold text-green-600">{asset.unitPrice?.toLocaleString('vi-VN')}đ</span></td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <div>SX: {formatDate(asset.mfgDate)}</div>
                          <div className={isAssetExpired(asset.expDate) ? 'text-red-600' : ''}>HSD: {formatDate(asset.expDate)}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs ${asset.available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{asset.available ? 'Có sẵn' : 'Không có sẵn'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              setEditingAsset(asset);
                              setAssetForm({
                                name: asset.name || '',
                                sku: asset.sku || '',
                                description: asset.description || '',
                                type: asset.type || '',
                                brandFamilyCode: asset.brandFamilyCode || '',
                                clientId: asset.clientId || '',
                                clientName: asset.clientName || '',
                                orgId: asset.orgId || '',
                                projectId: asset.projectId || '',
                                pack: asset.pack || '',
                                unit: asset.unit || '',
                                unitPerPack: asset.unitPerPack || 1,
                                unitPerBundle: asset.unitPerBundle || 1,
                                unitPrice: asset.unitPrice || 0,
                                packPrice: asset.packPrice || 0,
                                packHeight: asset.packHeight || 0,
                                packLength: asset.packLength || 0,
                                packWeight: asset.packWeight || 0,
                                packWidth: asset.packWidth || 0,
                                mfgDate: asset.mfgDate ? formatDate(asset.mfgDate) : '',
                                expDate: asset.expDate ? formatDate(asset.expDate) : '',
                                available: asset.available !== undefined ? asset.available : true,
                                tags: asset.tags || [],
                                photos: asset.photos || []
                              });
                              setShowAssetForm(true);
                            }} 
                            className="p-2 hover:bg-gray-100 rounded"
                            title="Chỉnh sửa"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={async () => {
                              const confirmed = await confirm('Xóa tài sản này?');
                              if (confirmed) {
                                try {
                                  // ✅ Clean Architecture: Sử dụng hook method
                                  await deleteAssetHook(asset.id);
                                  await load(); // Reload transactions
                                  // ✅ Toast message đã được handle trong hook
                                } catch (error) {
                                  // Error đã được handle trong hook
                                  console.error('Error in deleteAsset:', error);
                                }
                              }
                            }} 
                            className="p-2 hover:bg-gray-100 rounded text-red-600"
                            title="Xóa"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {getPaginatedItems(filteredAssets).length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-center text-gray-500" colSpan="8">Không có tài sản nào</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Balances Tab */}
      {activeTab === 'balances' && (
        <div className="bg-white shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Số dư kho</h3>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    value={search}
                    onChange={(e)=>setSearch(e.target.value)}
                    placeholder="Tìm kiếm số dư..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <button 
                  onClick={() => { setShowBalanceForm(true); setEditingBalance(null); setBalanceForm(defaultBalanceForm); }} 
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Thêm số dư</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sản phẩm</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kho</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tồn kho</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Có sẵn</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đã đặt</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhập/Xuất</th>
                    <th className="w-24 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedItems(filteredBalances).map((balance) => (
                    <BalanceRow key={balance.id} balance={balance} />
                  ))}
                  {getPaginatedItems(filteredBalances).length === 0 && (
                    <tr>
                      <td className="px-6 py-6 text-center text-gray-500" colSpan="7">Không có số dư nào</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3">Mã giao dịch</th>
                <th className="text-left px-4 py-3">Từ kho</th>
                <th className="text-left px-4 py-3">Đến kho</th>
                <th className="text-left px-4 py-3">Số lượng</th>
                <th className="text-left px-4 py-3">Trạng thái</th>
                <th className="text-left px-4 py-3">Thời gian</th>
                <th className="w-24 px-4 py-3">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {getPaginatedItems(filteredTransactions).map((transaction) => (
                <tr key={transaction.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {transaction.id.slice(0, 8)}...
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-sm">{transaction.fromWarehouseName || '-'}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-sm">{transaction.toWarehouseName || '-'}</span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="font-semibold">
                      {calculateTransactionTotalQuantity(transaction)}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${getTransactionStatusColor(transaction.status)}`}>
                      {getTransactionStatusText(transaction.status)}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span className="text-sm">{formatDateTime(transaction.createdAt)}</span>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => {
                          setShowDetails(transaction);
                        }} 
                        className="p-2 hover:bg-gray-100 rounded"
                        title="Xem chi tiết"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          // TODO: Implement edit transaction
                          toast.info('Chức năng sửa giao dịch đang được phát triển');
                        }} 
                        className="p-2 hover:bg-gray-100 rounded"
                        title="Chỉnh sửa"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={async () => {
                          const confirmed = await confirm('Xóa giao dịch này?');
                          if (confirmed) {
                            try {
                              await deleteStockTransaction(transaction.id);
                              await load();
                              toast.success('Đã xóa giao dịch thành công!');
                            } catch (error) {
                              console.error('Error deleting transaction:', error);
                              toast.error('Có lỗi xảy ra khi xóa giao dịch');
                            }
                          }
                        }} 
                        className="p-2 hover:bg-gray-100 rounded text-red-600"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {getPaginatedItems(filteredTransactions).length === 0 && (
                <tr>
                  <td className="px-4 py-6 text-center text-gray-500" colSpan="7">
                    Không có giao dịch nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {(() => {
        const items = activeTab === 'assets' ? filteredAssets : 
                     activeTab === 'balances' ? filteredBalances : 
                     activeTab === 'transactions' ? filteredTransactions : [];
        
        return items.length > 0 && (
          <div className="mt-6 flex justify-center">
            <Pagination
              current={currentPage}
              total={items.length}
              pageSize={itemsPerPage}
              showSizeChanger={false}
              showQuickJumper={false}
              showTotal={false}
              onChange={(page) => setCurrentPage(page)}
              className="ant-pagination-custom"
            />
          </div>
        );
      })()}

      {/* Form tạo/sửa tài sản */}
      {showAssetForm && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAssetForm(false);
              setEditingAsset(null);
              setAssetForm(defaultAssetForm);
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              {editingAsset ? 'Cập nhật tài sản' : 'Thêm tài sản mới'}
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (editingAsset) {
                  // ✅ Clean Architecture: Sử dụng hook method
                  await updateAssetHook(editingAsset.id, assetForm, currentUser);
                } else {
                  // ✅ Clean Architecture: Sử dụng hook method
                  await createAssetHook(assetForm, currentUser);
                }
                await load(); // Reload transactions
                setShowAssetForm(false);
                setEditingAsset(null);
                setAssetForm(defaultAssetForm);
                // ✅ Toast message đã được handle trong hook
              } catch (error) {
                // Error đã được handle trong hook
                console.error('Error in submitAsset:', error);
              }
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tên sản phẩm *</label>
                  <input 
                    value={assetForm.name} 
                    onChange={(e)=>setAssetForm({...assetForm, name: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">SKU</label>
                  <input 
                    value={assetForm.sku} 
                    onChange={(e)=>setAssetForm({...assetForm, sku: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Loại</label>
                  <input 
                    value={assetForm.type} 
                    onChange={(e)=>setAssetForm({...assetForm, type: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Dự án</label>
                  <select 
                    value={assetForm.projectId} 
                    onChange={(e)=>setAssetForm({...assetForm, projectId: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">-- Chọn dự án --</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Đơn vị</label>
                  <input 
                    value={assetForm.pack} 
                    onChange={(e)=>setAssetForm({...assetForm, pack: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                    placeholder="thùng, hộp, cái..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Giá đơn vị</label>
                  <input 
                    type="number"
                    value={assetForm.unitPrice} 
                    onChange={(e)=>setAssetForm({...assetForm, unitPrice: parseFloat(e.target.value) || 0})} 
                    className="w-full border rounded-lg px-3 py-2" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số đơn vị/thùng</label>
                  <input 
                    type="number"
                    value={assetForm.unitPerPack} 
                    onChange={(e)=>setAssetForm({...assetForm, unitPerPack: parseInt(e.target.value) || 1})} 
                    className="w-full border rounded-lg px-3 py-2" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ngày sản xuất</label>
                  <input 
                    type="date"
                    value={assetForm.mfgDate} 
                    onChange={(e)=>setAssetForm({...assetForm, mfgDate: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Hạn sử dụng</label>
                  <input 
                    type="date"
                    value={assetForm.expDate} 
                    onChange={(e)=>setAssetForm({...assetForm, expDate: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Giá thùng</label>
                  <input 
                    type="number"
                    value={assetForm.packPrice} 
                    onChange={(e)=>setAssetForm({...assetForm, packPrice: parseFloat(e.target.value) || 0})} 
                    className="w-full border rounded-lg px-3 py-2" 
                  />
                </div>
                <div>
                  <label className="flex items-center">
                    <input 
                      type="checkbox"
                      checked={assetForm.available} 
                      onChange={(e)=>setAssetForm({...assetForm, available: e.target.checked})} 
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Có sẵn</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea 
                  value={assetForm.description} 
                  onChange={(e)=>setAssetForm({...assetForm, description: e.target.value})} 
                  className="w-full border rounded-lg px-3 py-2" 
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={()=>{setShowAssetForm(false); setEditingAsset(null); setAssetForm(defaultAssetForm);}} 
                  className="px-3 py-2 rounded border hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-3 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {editingAsset ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Form tạo/sửa số dư */}
      {showBalanceForm && (
        <div 
          className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowBalanceForm(false);
              setEditingBalance(null);
              setBalanceForm(defaultBalanceForm);
            }
          }}
        >
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Warehouse className="w-5 h-5 mr-2" />
              {editingBalance ? 'Cập nhật số dư' : 'Thêm số dư mới'}
            </h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                if (editingBalance) {
                  // ✅ Clean Architecture: Sử dụng hook method
                  await updateBalanceHook(editingBalance.id, balanceForm, currentUser);
                } else {
                  // ✅ Clean Architecture: Sử dụng hook method
                  await createBalanceHook(balanceForm, currentUser);
                }
                await load(); // Reload transactions
                setShowBalanceForm(false);
                setEditingBalance(null);
                setBalanceForm(defaultBalanceForm);
                // ✅ Toast message đã được handle trong hook
              } catch (error) {
                // Error đã được handle trong hook
                console.error('Error in submitBalance:', error);
              }
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tài sản *</label>
                  <select 
                    value={balanceForm.assetId} 
                    onChange={(e) => {
                      const asset = assets.find(a => a.id === e.target.value);
                      setBalanceForm({
                        ...balanceForm, 
                        assetId: e.target.value,
                        assetName: asset ? asset.name : '',
                        assetSku: asset ? asset.sku : ''
                      });
                    }} 
                    className="w-full border rounded-lg px-3 py-2"
                    required
                  >
                    <option value="">-- Chọn tài sản --</option>
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kho</label>
                  <select 
                    value={balanceForm.warehouseId} 
                    onChange={(e) => {
                      const location = locations.find(l => l.id === e.target.value);
                      setBalanceForm({
                        ...balanceForm, 
                        warehouseId: e.target.value,
                        warehouseName: location ? location.name : ''
                      });
                    }} 
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="">-- Chọn kho --</option>
                    {locations.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Số lượng tồn</label>
                  <input 
                    type="number"
                    value={balanceForm.unitQty} 
                    onChange={(e)=>setBalanceForm({...balanceForm, unitQty: parseInt(e.target.value) || 0})} 
                    className="w-full border rounded-lg px-3 py-2" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số lượng đã đặt</label>
                  <input 
                    type="number"
                    value={balanceForm.bookedUnitQty} 
                    onChange={(e)=>setBalanceForm({...balanceForm, bookedUnitQty: parseInt(e.target.value) || 0})} 
                    className="w-full border rounded-lg px-3 py-2" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Số lượng nhập</label>
                  <input 
                    type="number"
                    value={balanceForm.inboundUnitQty} 
                    onChange={(e)=>setBalanceForm({...balanceForm, inboundUnitQty: parseInt(e.target.value) || 0})} 
                    className="w-full border rounded-lg px-3 py-2" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Số lượng xuất</label>
                  <input 
                    type="number"
                    value={balanceForm.outboundUnitQty} 
                    onChange={(e)=>setBalanceForm({...balanceForm, outboundUnitQty: parseInt(e.target.value) || 0})} 
                    className="w-full border rounded-lg px-3 py-2" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Số lượng hao hụt</label>
                  <input 
                    type="number"
                    value={balanceForm.shrinkageUnitQty} 
                    onChange={(e)=>setBalanceForm({...balanceForm, shrinkageUnitQty: parseInt(e.target.value) || 0})} 
                    className="w-full border rounded-lg px-3 py-2" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Đơn vị</label>
                  <input 
                    value={balanceForm.pack} 
                    onChange={(e)=>setBalanceForm({...balanceForm, pack: e.target.value})} 
                    className="w-full border rounded-lg px-3 py-2" 
                    placeholder="thùng, hộp, cái..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button 
                  type="button" 
                  onClick={()=>{setShowBalanceForm(false); setEditingBalance(null); setBalanceForm(defaultBalanceForm);}} 
                  className="px-3 py-2 rounded border hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button 
                  type="submit" 
                  className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                >
                  {editingBalance ? 'Cập nhật' : 'Tạo mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
