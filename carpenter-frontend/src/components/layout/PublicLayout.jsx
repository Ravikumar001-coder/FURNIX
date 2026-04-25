import Navbar from './Navbar';
import Footer from './Footer';

const PublicLayout = ({ children }) => {
  return (
    <div className="bg-background text-on-background font-body antialiased min-h-screen flex flex-col selection:bg-primary-container selection:text-on-primary-container">
      <Navbar />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
