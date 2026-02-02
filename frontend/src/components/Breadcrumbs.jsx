import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const Breadcrumbs = ({ items }) => {
  return (
    <nav className="flex items-center text-sm mb-6" data-testid="breadcrumbs">
      <Link 
        to="/" 
        className="text-[#7A7A79] hover:text-[#384E84] transition-colors flex items-center"
      >
        <Home className="w-4 h-4" />
      </Link>
      {items.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="w-4 h-4 mx-2 text-[#DCDCDC]" />
          {item.href ? (
            <Link 
              to={item.href}
              className="text-[#7A7A79] hover:text-[#384E84] transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-[#212121] font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
