import { useState, useCallback } from 'react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const useBranchesCompanies = () => {
  const [branches, setBranches] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setLoadingMessage('Loading data...');

    try {
      const [branchesResult, companiesResult] = await Promise.all([
        api.get('/branches'),
        api.get('/companies'),
      ]);

      if (branchesResult.success) {
        setBranches(branchesResult.data);
      } else {
        setBranches([]);
        toast.error('Failed to load branches');
      }

      if (companiesResult.success) {
        setCompanies(companiesResult.data);
        setAllCompanies(companiesResult.data);
      } else {
        setCompanies([]);
        setAllCompanies([]);
        toast.error('Failed to load companies');
      }
    } catch (error) {
      toast.error('Failed to load data');
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const handleEdit = useCallback(async (branch) => {
    setLoading(true);
    setLoadingMessage('Loading branch details...');

    try {
      let companyData = null;

      if (branch.company) {
        companyData = branch.company;
      } else {
        const response = await api.get(`/companies/by-branch-id/${branch.id}`);
        if (response.success) {
          companyData = response.data;
        }
      }

      // This would be handled by the modal component
      return { branch, company: companyData };
    } catch (error) {
      toast.error('Failed to load branch details');
      console.error('Edit branch error:', error);
      return null;
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this branch and its associated company?')) return;

    setLoading(true);
    setLoadingMessage('Deleting branch...');

    try {
      const result = await api.delete(`/branches/${id}`);

      if (result.success) {
        toast.success('Branch and Company deleted successfully');
        await loadData();
      } else {
        toast.error(result.message || 'Cannot delete branch. It may have associated sales records.');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete branch');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }, [loadData]);

  const handleDeleteCompany = useCallback(async (companyId) => {
    const company = companies.find(c => c.id === companyId);
    const branchCount = company?.branches?.length || 0;

    if (branchCount > 0) {
      toast.error(`Cannot delete company: This company has ${branchCount} associated branch(es). Please delete or reassign the branches first.`, {
        duration: 5000
      });
      return;
    }

    if (!window.confirm('Are you sure you want to delete this company?')) return;

    setLoading(true);
    setLoadingMessage('Deleting company...');

    try {
      const result = await api.delete(`/companies/${companyId}`);

      if (result.success) {
        toast.success('Company deleted successfully');
        await loadData();
      } else {
        toast.error(result.message || 'Cannot delete company');
      }
    } catch (error) {
      console.error('Delete company error:', error);
      toast.error(error.message || 'Failed to delete company');
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }, [companies, loadData]);

  const handleViewCompany = useCallback((company) => {
    if (company.branches && company.branches.length > 0) {
      const enrichedBranches = company.branches.map(branch => {
        const fullBranch = branches.find(b => b.id === branch.id);
        return fullBranch || branch;
      });

      const companyWithFullBranches = {
        ...company,
        branches: enrichedBranches
      };

      return companyWithFullBranches;
    }
    return company;
  }, [branches]);

  const handleViewBranch = useCallback(async (branch) => {
    setLoading(true);
    setLoadingMessage('Loading branch details...');
    
    try {
      let companyData = null;

      if (branch.company) {
        companyData = branch.company;
      } else {
        const response = await api.get(`/companies/by-branch-id/${branch.id}`);
        if (response.success) {
          companyData = response.data;
        }
      }

      return {
        ...branch,
        address: branch.address || branch.branchAddress,
        city: branch.city || branch.branchCity,
        province: branch.province || branch.branchProvince,
        company: companyData
      };
    } catch (error) {
      toast.error('Failed to load branch details');
      console.error('View branch error:', error);
      return null;
    } finally {
      setLoading(false);
      setLoadingMessage('');
    }
  }, []);

  const handleEditCompany = useCallback((company) => {
    // This would be handled by the modal component
    return company;
  }, []);

  return {
    branches,
    companies,
    allCompanies,
    loading,
    loadingMessage,
    loadData,
    handleEdit,
    handleDelete,
    handleDeleteCompany,
    handleViewCompany,
    handleViewBranch,
    handleEditCompany
  };
};