    /**
 * Service để khởi tạo Use Cases với Infrastructure dependencies
 * Đây là nơi kết nối Domain Layer với Infrastructure Layer
 */
import * as projectsRepo from '../repositories/projectsRepository.js';
import * as orgsRepo from '../repositories/orgsRepository.js';
import * as salesRepo from '../repositories/salesRepository.js';
import * as locationsRepo from '../repositories/locationsRepository.js';
import * as schedulesRepo from '../repositories/schedulesRepository.js';
import * as stockAssetsRepo from '../repositories/stockAssetsRepository.js';
import * as stockBalancesRepo from '../repositories/stockBalancesRepository.js';
import * as productsRepo from '../repositories/productsRepository.js';
import * as premiumsRepo from '../repositories/premiumsRepository.js';
import * as settingsRepo from '../repositories/settingsRepository.js';
import * as aclsRepo from '../repositories/aclsRepository.js';
import * as membersRepo from '../repositories/membersRepository.js';
import * as projectsLocationsRepo from '../repositories/projectsLocationsRepository.js';
import {
  ListProjectsUseCase,
  CreateProjectUseCase,
  UpdateProjectUseCase,
  DeleteProjectUseCase
} from '../../domain/usecases/projects/index.js';
import {
  ListOrgsUseCase,
  CreateOrgUseCase,
  UpdateOrgUseCase,
  DeleteOrgUseCase
} from '../../domain/usecases/orgs/index.js';
import {
  ListSalesUseCase,
  CreateSaleUseCase,
  UpdateSaleUseCase,
  DeleteSaleUseCase
} from '../../domain/usecases/sales/index.js';
import {
  GetProjectMembersUseCase,
  GetOrgMembersUseCase,
  AddUserToProjectUseCase,
  AddUserToOrgUseCase
} from '../../domain/usecases/members/index.js';
import {
  ListLocationsUseCase,
  CreateLocationUseCase,
  UpdateLocationUseCase,
  DeleteLocationUseCase
} from '../../domain/usecases/locations/index.js';
import {
  ListSchedulesUseCase,
  CreateScheduleUseCase,
  UpdateScheduleUseCase,
  DeleteScheduleUseCase
} from '../../domain/usecases/schedules/index.js';
import {
  ListStockAssetsUseCase,
  CreateStockAssetUseCase,
  UpdateStockAssetUseCase,
  DeleteStockAssetUseCase
} from '../../domain/usecases/stockAssets/index.js';
import {
  ListStockBalancesUseCase,
  CreateStockBalanceUseCase,
  UpdateStockBalanceUseCase,
  DeleteStockBalanceUseCase
} from '../../domain/usecases/stockBalances/index.js';
import {
  ListProductsUseCase,
  CreateProductUseCase,
  UpdateProductUseCase,
  DeleteProductUseCase
} from '../../domain/usecases/products/index.js';
import {
  ListPremiumsUseCase,
  CreatePremiumUseCase,
  UpdatePremiumUseCase,
  DeletePremiumUseCase
} from '../../domain/usecases/premiums/index.js';
import {
  GetSettingsUseCase,
  SaveSettingsUseCase
} from '../../domain/usecases/settings/index.js';
import {
  ListAclsUseCase,
  CreateAclRuleUseCase,
  UpdateAclRuleUseCase,
  DeleteAclRuleUseCase
} from '../../domain/usecases/acls/index.js';
import {
  GetLocationsByProjectUseCase,
  CreateProjectLocationUseCase,
  DeleteProjectLocationUseCase
} from '../../domain/usecases/projectsLocations/index.js';

// Create adapter để implement repository interface
class ProjectsRepositoryAdapter {
  async listProjects(filters = {}) {
    return await projectsRepo.listProjects(filters);
  }

  async getProjectById(id) {
    return await projectsRepo.getProjectById(id);
  }

  async createProject(projectData, user) {
    return await projectsRepo.createProject(projectData, user);
  }

  async updateProject(id, projectData, user) {
    return await projectsRepo.updateProject(id, projectData, user);
  }

  async deleteProject(id) {
    return await projectsRepo.deleteProject(id);
  }
}

// Create adapter cho Orgs Repository
class OrgsRepositoryAdapter {
  async listOrgs() {
    return await orgsRepo.listOrgs();
  }

  async getOrgById(id) {
    // Fallback: get from list if not exists
    const orgs = await orgsRepo.listOrgs();
    return orgs.find(o => o.id === id) || null;
  }

  async createOrg(orgData, user) {
    return await orgsRepo.createOrg(orgData, user);
  }

  async updateOrg(id, orgData, user) {
    return await orgsRepo.updateOrg(id, orgData, user);
  }

  async deleteOrg(id) {
    return await orgsRepo.deleteOrg(id);
  }

  async uploadOrgPhoto(orgId, file) {
    return await orgsRepo.uploadOrgPhoto(orgId, file);
  }
}

// Initialize repository adapters
const projectsRepository = new ProjectsRepositoryAdapter();
const orgsRepository = new OrgsRepositoryAdapter();

// Export initialized use cases - Projects
export const listProjectsUseCase = new ListProjectsUseCase(projectsRepository);
export const createProjectUseCase = new CreateProjectUseCase(projectsRepository);
export const updateProjectUseCase = new UpdateProjectUseCase(projectsRepository);
export const deleteProjectUseCase = new DeleteProjectUseCase(projectsRepository);

// Export initialized use cases - Orgs
export const listOrgsUseCase = new ListOrgsUseCase(orgsRepository);
export const createOrgUseCase = new CreateOrgUseCase(orgsRepository);
export const updateOrgUseCase = new UpdateOrgUseCase(orgsRepository);
export const deleteOrgUseCase = new DeleteOrgUseCase(orgsRepository);

// Create adapter cho Sales Repository
class SalesRepositoryAdapter {
  async listSales(filters = {}) {
    return await salesRepo.listSales(filters);
  }

  async getSaleById(id) {
    return await salesRepo.getSaleById(id);
  }

  async createSale(saleData, user, userName) {
    return await salesRepo.createSale(saleData, user, userName);
  }

  async updateSale(id, saleData, user) {
    return await salesRepo.updateSale(id, saleData, user);
  }

  async deleteSale(id) {
    return await salesRepo.deleteSale(id);
  }
}

// Initialize repository adapter
const salesRepository = new SalesRepositoryAdapter();

// Export initialized use cases - Sales
export const listSalesUseCase = new ListSalesUseCase(salesRepository);
export const createSaleUseCase = new CreateSaleUseCase(salesRepository);
export const updateSaleUseCase = new UpdateSaleUseCase(salesRepository);
export const deleteSaleUseCase = new DeleteSaleUseCase(salesRepository);

// Create adapter cho Locations Repository
class LocationsRepositoryAdapter {
  async listLocations(filters = {}) {
    return await locationsRepo.listLocations(filters);
  }

  async getLocationById(id) {
    // Fallback: get from list if not exists
    const locations = await locationsRepo.listLocations({});
    return locations.find(l => l.id === id) || null;
  }

  async createLocation(locationData, user) {
    return await locationsRepo.createLocation(locationData, user);
  }

  async updateLocation(id, locationData, user) {
    return await locationsRepo.updateLocation(id, locationData, user);
  }

  async deleteLocation(id) {
    return await locationsRepo.deleteLocation(id);
  }
}

// Initialize repository adapter
const locationsRepository = new LocationsRepositoryAdapter();

// Export initialized use cases - Locations
export const listLocationsUseCase = new ListLocationsUseCase(locationsRepository);
export const createLocationUseCase = new CreateLocationUseCase(locationsRepository);
export const updateLocationUseCase = new UpdateLocationUseCase(locationsRepository);
export const deleteLocationUseCase = new DeleteLocationUseCase(locationsRepository);

// Create adapter cho Schedules Repository
class SchedulesRepositoryAdapter {
  async listSchedules(filters = {}) {
    return await schedulesRepo.listSchedules(filters);
  }

  async getScheduleById(id) {
    // Fallback: get from list if not exists
    const schedules = await schedulesRepo.listSchedules({});
    return schedules.find(s => s.id === id) || null;
  }

  async createSchedule(scheduleData, user) {
    return await schedulesRepo.createSchedule(scheduleData, user);
  }

  async updateSchedule(id, scheduleData, user) {
    return await schedulesRepo.updateSchedule(id, scheduleData, user);
  }

  async deleteSchedule(id) {
    return await schedulesRepo.deleteSchedule(id);
  }
}

// Initialize repository adapter
const schedulesRepository = new SchedulesRepositoryAdapter();

// Export initialized use cases - Schedules
export const listSchedulesUseCase = new ListSchedulesUseCase(schedulesRepository);
export const createScheduleUseCase = new CreateScheduleUseCase(schedulesRepository);
export const updateScheduleUseCase = new UpdateScheduleUseCase(schedulesRepository);
export const deleteScheduleUseCase = new DeleteScheduleUseCase(schedulesRepository);

// Create adapter cho StockAssets Repository
class StockAssetsRepositoryAdapter {
  async listStockAssets(filters = {}) {
    return await stockAssetsRepo.listStockAssets({
      accessibleProjectIds: filters.accessibleProjectIds,
    });
  }

  async getStockAssetById(id) {
    // Fallback: get from list if not exists
    const assets = await stockAssetsRepo.listStockAssets({});
    return assets.find(a => a.id === id) || null;
  }

  async createStockAsset(assetData, user) {
    return await stockAssetsRepo.createStockAsset(assetData, user);
  }

  async updateStockAsset(id, assetData, user) {
    return await stockAssetsRepo.updateStockAsset(id, assetData, user);
  }

  async deleteStockAsset(id) {
    return await stockAssetsRepo.deleteStockAsset(id);
  }
}

// Create adapter cho StockBalances Repository
class StockBalancesRepositoryAdapter {
  async listStockBalances(filters = {}) {
    return await stockBalancesRepo.listStockBalances({
      accessibleProjectIds: filters.accessibleProjectIds,
    });
  }

  async getStockBalanceById(id) {
    // Fallback: get from list if not exists
    const balances = await stockBalancesRepo.listStockBalances({});
    return balances.find(b => b.id === id) || null;
  }

  async createStockBalance(balanceData, user) {
    return await stockBalancesRepo.createStockBalance(balanceData, user);
  }

  async updateStockBalance(id, balanceData, user) {
    return await stockBalancesRepo.updateStockBalance(id, balanceData, user);
  }

  async deleteStockBalance(id) {
    return await stockBalancesRepo.deleteStockBalance(id);
  }
}

// Initialize repository adapters
const stockAssetsRepository = new StockAssetsRepositoryAdapter();
const stockBalancesRepository = new StockBalancesRepositoryAdapter();

// Export initialized use cases - StockAssets
export const listStockAssetsUseCase = new ListStockAssetsUseCase(stockAssetsRepository);
export const createStockAssetUseCase = new CreateStockAssetUseCase(stockAssetsRepository);
export const updateStockAssetUseCase = new UpdateStockAssetUseCase(stockAssetsRepository);
export const deleteStockAssetUseCase = new DeleteStockAssetUseCase(stockAssetsRepository);

// Export initialized use cases - StockBalances
export const listStockBalancesUseCase = new ListStockBalancesUseCase(stockBalancesRepository);
export const createStockBalanceUseCase = new CreateStockBalanceUseCase(stockBalancesRepository);
export const updateStockBalanceUseCase = new UpdateStockBalanceUseCase(stockBalancesRepository);
export const deleteStockBalanceUseCase = new DeleteStockBalanceUseCase(stockBalancesRepository);

// Create adapter cho Products Repository
class ProductsRepositoryAdapter {
  async listProducts(filters = {}) {
    return await productsRepo.listProducts(filters);
  }

  async getProductById(id) {
    // Fallback: get from list if not exists
    const products = await productsRepo.listProducts({});
    return products.find(p => p.id === id) || null;
  }

  async createProduct(productData, user) {
    return await productsRepo.createProduct(productData, user);
  }

  async updateProduct(id, productData, user) {
    return await productsRepo.updateProduct(id, productData, user);
  }

  async deleteProduct(id) {
    return await productsRepo.deleteProduct(id);
  }
}

// Create adapter cho Premiums Repository
class PremiumsRepositoryAdapter {
  async listPremiums(filters = {}) {
    return await premiumsRepo.listPremiums({
      projectId: filters.projectId,
      search: filters.search,
      accessibleProjectIds: filters.accessibleProjectIds,
    });
  }

  async getPremiumById(id) {
    // Fallback: get from list if not exists
    const premiums = await premiumsRepo.listPremiums({});
    return premiums.find(p => p.id === id) || null;
  }

  async createPremium(premiumData, user) {
    return await premiumsRepo.createPremium(premiumData, user);
  }

  async updatePremium(id, premiumData, user) {
    return await premiumsRepo.updatePremium(id, premiumData, user);
  }

  async deletePremium(id) {
    return await premiumsRepo.deletePremium(id);
  }
}

// Initialize repository adapters
const productsRepository = new ProductsRepositoryAdapter();
const premiumsRepository = new PremiumsRepositoryAdapter();

// Export initialized use cases - Products
export const listProductsUseCase = new ListProductsUseCase(productsRepository);
export const createProductUseCase = new CreateProductUseCase(productsRepository);
export const updateProductUseCase = new UpdateProductUseCase(productsRepository);
export const deleteProductUseCase = new DeleteProductUseCase(productsRepository);

// Export initialized use cases - Premiums
export const listPremiumsUseCase = new ListPremiumsUseCase(premiumsRepository);
export const createPremiumUseCase = new CreatePremiumUseCase(premiumsRepository);
export const updatePremiumUseCase = new UpdatePremiumUseCase(premiumsRepository);
export const deletePremiumUseCase = new DeletePremiumUseCase(premiumsRepository);

// Create adapter cho Settings Repository
class SettingsRepositoryAdapter {
  async getSettingsByKey(key) {
    return await settingsRepo.getSettingsByKey(key);
  }

  async saveSettingsByKey(key, data) {
    return await settingsRepo.saveSettingsByKey(key, data);
  }
}

// Initialize repository adapter
const settingsRepository = new SettingsRepositoryAdapter();

// Export initialized use cases - Settings
export const getSettingsUseCase = new GetSettingsUseCase(settingsRepository);
export const saveSettingsUseCase = new SaveSettingsUseCase(settingsRepository);

// Create adapter cho ACLs Repository
class ACLsRepositoryAdapter {
  async listAcls(filters = {}) {
    return await aclsRepo.listAcls(filters);
  }

  async getAclById(id) {
    // Fallback: get from list if not exists
    const acls = await aclsRepo.listAcls({});
    return acls.find(a => a.id === id) || null;
  }

  async createAclRule(ruleData, user) {
    return await aclsRepo.createAclRule(ruleData, user);
  }

  async updateAclRule(id, ruleData, user) {
    return await aclsRepo.updateAclRule(id, ruleData, user);
  }

  async deleteAclRule(id) {
    return await aclsRepo.deleteAclRule(id);
  }
}

// Initialize repository adapter
const aclsRepository = new ACLsRepositoryAdapter();

// Export initialized use cases - ACLs
export const listAclsUseCase = new ListAclsUseCase(aclsRepository);
export const createAclRuleUseCase = new CreateAclRuleUseCase(aclsRepository);
export const updateAclRuleUseCase = new UpdateAclRuleUseCase(aclsRepository);
export const deleteAclRuleUseCase = new DeleteAclRuleUseCase(aclsRepository);

// Create adapter cho Members Repository
class MembersRepositoryAdapter {
  async getProjectMembers(projectId) {
    return await membersRepo.getProjectMembers(projectId);
  }

  async getOrgMembers(orgId) {
    return await membersRepo.getOrgMembers(orgId);
  }

  async addUserToProject(userId, projectId, orgId, role, tags, currentUserId) {
    return await membersRepo.addUserToProject(userId, projectId, orgId, role, tags, currentUserId);
  }

  async addUserToOrg(userId, orgId, role, tags, currentUserId) {
    return await membersRepo.addUserToOrg(userId, orgId, role, tags, currentUserId);
  }

  async getUsersByIds(userIds) {
    return await membersRepo.getUsersByIds(userIds);
  }

  async getUserOrgs(userId) {
    return await membersRepo.getUserOrgs(userId);
  }

  async getUserProjects(userId) {
    return await membersRepo.getUserProjects(userId);
  }

  async removeUserFromProject(userId, projectId) {
    return await membersRepo.removeUserFromProject(userId, projectId);
  }

  async removeUserFromOrg(userId, orgId) {
    return await membersRepo.removeUserFromOrg(userId, orgId);
  }
}

// Create adapter cho ProjectsLocations Repository
class ProjectsLocationsRepositoryAdapter {
  async getLocationsByProject(projectId) {
    return await projectsLocationsRepo.getLocationsByProject(projectId);
  }

  async createProjectLocation(data, user) {
    return await projectsLocationsRepo.createProjectLocation(data, user);
  }

  async deleteProjectLocation(projectId, locationId) {
    return await projectsLocationsRepo.deleteProjectLocation(projectId, locationId);
  }
}

// Initialize repository adapters
const membersRepository = new MembersRepositoryAdapter();
const projectsLocationsRepository = new ProjectsLocationsRepositoryAdapter();

// Export initialized use cases - Members
export const getProjectMembersUseCase = new GetProjectMembersUseCase(membersRepository);
export const getOrgMembersUseCase = new GetOrgMembersUseCase(membersRepository);
export const addUserToProjectUseCase = new AddUserToProjectUseCase(membersRepository);
export const addUserToOrgUseCase = new AddUserToOrgUseCase(membersRepository);

// Export initialized use cases - ProjectsLocations
export const getLocationsByProjectUseCase = new GetLocationsByProjectUseCase(projectsLocationsRepository);
export const createProjectLocationUseCase = new CreateProjectLocationUseCase(projectsLocationsRepository);
export const deleteProjectLocationUseCase = new DeleteProjectLocationUseCase(projectsLocationsRepository);

// Export repository adapters for additional operations
export const orgsRepositoryAdapter = orgsRepository;
export const membersRepositoryAdapter = membersRepository;
export const projectsLocationsRepositoryAdapter = projectsLocationsRepository;

