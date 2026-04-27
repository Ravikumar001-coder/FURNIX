import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Clock, Calendar, Image as ImageIcon, ChevronLeft, Package, Hammer, Ruler, Truck } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { formatDate, timeAgo } from '../../utils/helpers';
import PublicLayout from '../../components/layout/PublicLayout';

const STAGE_CONFIG = {
  INQUIRY: { icon: Clock, label: 'Inquiry Received', color: 'blue' },
  ESTIMATE: { icon: Calculator, label: 'Estimate Provided', color: 'indigo' },
  SITE_VISIT: { icon: Ruler, label: 'Site Measurement', color: 'purple' },
  DESIGN: { icon: ImageIcon, label: 'Design & Approval', color: 'pink' },
  MATERIAL_SELECTION: { icon: Package, label: 'Material Sourcing', color: 'orange' },
  WORK_IN_PROGRESS: { icon: Hammer, label: 'Production Started', color: 'amber' },
  FINISHING: { icon: Sparkles, label: 'Finishing Touches', color: 'teal' },
  READY: { icon: CheckCircle2, label: 'Quality Check Passed', color: 'emerald' },
  DELIVERED: { icon: Truck, label: 'Delivered & Installed', color: 'green' }
};

// Simple Fallback Icons if Lucide ones are missing or different
const Calculator = (props) => <span {...props} className="material-symbols-outlined text-[20px]">calculate</span>;
const Sparkles = (props) => <span {...props} className="material-symbols-outlined text-[20px]">auto_awesome</span>;

const ProjectTrackingPage = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const data = await projectService.getById(id);
        setProject(data);
      } catch (err) {
        setError('Could not find project details. Please check your link.');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <PublicLayout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin mb-4" />
          <p className="text-gray-500 font-medium">Fetching your project status...</p>
        </div>
      </PublicLayout>
    );
  }

  if (error || !project) {
    return (
      <PublicLayout>
        <div className="max-w-2xl mx-auto py-20 px-6 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500 mb-6">
            <Clock size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link to="/account" className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:gap-3 transition-all">
            <ChevronLeft size={20} /> Return to Account
          </Link>
        </div>
      </PublicLayout>
    );
  }

  const currentStageIdx = Object.keys(STAGE_CONFIG).indexOf(project.currentStage);

  return (
    <PublicLayout>
      <div className="bg-gray-50 min-h-screen pb-20">
        {/* Header Section */}
        <div className="bg-white border-b border-gray-100 pt-12 pb-8">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  <Link to="/account" className="hover:text-primary-600 transition-colors">My Account</Link>
                  <span>/</span>
                  <span className="text-gray-900 font-medium">Project Tracking</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                  Project <span className="text-primary-600">#{project.id}</span>
                </h1>
                <p className="text-gray-500 mt-2 font-medium">
                  {project.customerName}'s Bespoke Commission
                </p>
              </div>
              
              <div className="flex gap-4">
                <div className="bg-primary-50 px-4 py-3 rounded-xl border border-primary-100">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-primary-600 mb-1">Current Status</p>
                  <p className="text-sm font-bold text-primary-900">
                    {STAGE_CONFIG[project.currentStage]?.label || project.currentStage}
                  </p>
                </div>
                <div className="bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Exp. Delivery</p>
                  <p className="text-sm font-bold text-gray-900">
                    {project.expectedCompletionDate ? formatDate(project.expectedCompletionDate) : 'TBD'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Timeline */}
          <div className="lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 mb-8 flex items-center gap-2">
              <Calendar size={20} className="text-primary-600" />
              Production Timeline
            </h3>

            <div className="relative">
              {/* Vertical Line */}
              <div className="absolute left-[19px] top-2 bottom-0 w-0.5 bg-gray-200" />

              <div className="space-y-12">
                {project.updates.map((update, idx) => {
                  const Icon = STAGE_CONFIG[update.stage]?.icon || Clock;
                  const isLatest = idx === 0;

                  return (
                    <div key={update.id} className="relative pl-12 group">
                      {/* Indicator Dot */}
                      <div className={`absolute left-0 w-10 h-10 rounded-full border-4 border-gray-50 flex items-center justify-center z-10 transition-all shadow-sm ${
                        isLatest ? 'bg-primary-600 text-white scale-110 shadow-primary-200 shadow-xl' : 'bg-white text-gray-400'
                      }`}>
                        <Icon size={18} />
                      </div>

                      <div className={`p-6 rounded-2xl border transition-all ${
                        isLatest ? 'bg-white border-primary-100 shadow-lg shadow-gray-200/50' : 'bg-transparent border-transparent'
                      }`}>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className={`font-bold ${isLatest ? 'text-gray-900' : 'text-gray-500'}`}>
                            {STAGE_CONFIG[update.stage]?.label || update.stage}
                          </h4>
                          <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {timeAgo(update.createdAt)}
                          </span>
                        </div>
                        
                        <p className={`text-sm leading-relaxed mb-4 ${isLatest ? 'text-gray-600' : 'text-gray-400'}`}>
                          {update.comment}
                        </p>

                        {update.imageUrl && (
                          <div className="mt-4 rounded-xl overflow-hidden border border-gray-100 group-hover:border-primary-100 transition-colors">
                            <img 
                              src={update.imageUrl} 
                              alt={update.stage} 
                              className="w-full h-auto object-cover hover:scale-105 transition-transform duration-500 cursor-zoom-in"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Initial Project Start placeholder if updates exist */}
                {project.startDate && (
                  <div className="relative pl-12">
                    <div className="absolute left-[13px] w-3 h-3 rounded-full bg-gray-300 z-10" />
                    <div className="pl-6">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                        Project Commenced on {formatDate(project.startDate)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar / Quick Info */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 border-b border-gray-50 pb-2">
                Transparency Promise
              </h4>
              <p className="text-xs text-gray-500 leading-loose">
                Every Bespoke commission undergoes a rigorous multi-stage quality assurance process. We share live updates to ensure the final piece matches your vision exactly.
              </p>
              <div className="mt-6 flex items-center gap-3 text-primary-600 bg-primary-50 p-3 rounded-xl border border-primary-100">
                <CheckCircle2 size={18} />
                <span className="text-xs font-bold">10-Year Warranty Guaranteed</span>
              </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-2xl shadow-xl text-white">
              <h4 className="text-sm font-bold uppercase tracking-wider mb-4 text-primary-400">
                Need Assistance?
              </h4>
              <p className="text-xs text-gray-400 mb-6 leading-relaxed">
                Have questions about your project's current stage or material selection?
              </p>
              <a 
                href="https://wa.me/919876543210" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-white text-gray-900 font-bold py-3 rounded-xl hover:bg-primary-50 transition-colors"
              >
                Chat with Craftsman
              </a>
            </div>
          </div>

        </div>
      </div>
    </PublicLayout>
  );
};

export default ProjectTrackingPage;
