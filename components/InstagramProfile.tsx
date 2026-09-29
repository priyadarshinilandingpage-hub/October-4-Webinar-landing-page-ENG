import Image from "next/image";
import { ABOUT } from "./content";

/**
 * Her Instagram profile header rebuilt as page elements (not a screenshot), so it scales on every screen:
 * a black card with a white "liquid glass" stroke (Shyam, 30 Sep 2026), her photo, the handle with the
 * verified badge, posts / followers / following, and the bio lines. Every value comes from ABOUT.instagram
 * (copied from the public profile; update the numbers there). Styles: .ig-* in app/globals.css.
 */
export function InstagramProfile({ className = "" }: { className?: string }) {
  const ig = ABOUT.instagram;
  return (
    <a href={ig.url} target="_blank" rel="noopener noreferrer" aria-label={`${ig.handle} on Instagram, ${ig.followers} followers (opens in a new tab)`} className={`ig-card ${className}`}>
      <div className="ig-inner">
        {/* Her Instagram profile photo (enlarged copy of the 150 px avatar: public/media/instagram/profile-480.jpg). */}
        <span className="ig-avatar">
          <Image
            src="/media/instagram/profile-480.jpg"
            alt=""
            width={480}
            height={480}
            sizes="(min-width: 900px) 230px, 40vw"
            className="h-full w-full object-cover"
          />
        </span>
        <div className="ig-body">
          <p className="ig-handle">
            <span>{ig.handle.replace(/^@/, "")}</span>
            {ig.verified && (
              <svg viewBox="0 0 24 24" aria-label="Verified" className="ig-verified">
                <path d="M12 1.5l2.6 2.2 3.4-.4 1 3.3 3 1.7-1.3 3.2 1.3 3.2-3 1.7-1 3.3-3.4-.4L12 22.5l-2.6-2.2-3.4.4-1-3.3-3-1.7 1.3-3.2L2 9.3l3-1.7 1-3.3 3.4.4z" fill="currentColor" />
                <path d="M7.5 12.2l3 3 6-6.4" fill="none" stroke="#000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            <span aria-hidden="true" className="ig-more">
              ···
            </span>
          </p>
          <p className="ig-name">{ig.name}</p>
          <ul className="ig-stats" aria-label="Profile numbers">
            <li>
              <strong>{ig.posts}</strong> posts
            </li>
            <li>
              <strong>{ig.followers}</strong> followers
            </li>
            <li>
              <strong>{ig.following}</strong> following
            </li>
          </ul>
          <div className="ig-biobox">
            <p className="ig-cat">{ig.category}</p>
            <ul className="ig-bio">
              {ig.bio.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      <span className="ig-open">{ig.label} →</span>
    </a>
  );
}
